import { useLiveQuery } from "dexie-react-hooks";
import { db, Debt, Transaction } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { pushDebtToCloud, pushTransactionToCloud } from "@/lib/sync";

export function useDebts() {
    const { user } = useAuth();
    const debts = useLiveQuery(
        () => (user ? db.debts.where('userId').equals(user.id).toArray() : Promise.resolve([] as Debt[])),
        [user]
    );
    return debts ?? [];
}

export function useTransactions(debtId: number | undefined) {
    const transactions = useLiveQuery(
        () => (debtId ? db.transactions.where('debtId').equals(debtId).reverse().sortBy('date') : Promise.resolve([] as Transaction[])),
        [debtId]
    );
    return transactions ?? [];
}

export function useAllTransactions() {
    const { user } = useAuth();
    const transactions = useLiveQuery(
        () => (user ? db.transactions.where('userId').equals(user.id).reverse().sortBy('date') : Promise.resolve([] as Transaction[])),
        [user]
    );
    return transactions ?? [];
}

export async function addDebt(debt: Omit<Debt, "id" | "createdAt" | "updatedAt">) {
    if (!debt.userId) throw new Error("User ID is required");
    const id = await db.debts.add({
        ...debt,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // Cloud Sync (Async)
    db.debts.get(id).then(d => {
        if (d) pushDebtToCloud(d);
    });

    return id;
}

export async function updateDebt(id: number, changes: Partial<Debt>) {
    const result = await db.debts.update(id, {
        ...changes,
        updatedAt: new Date(),
    });

    // Cloud Sync
    db.debts.get(id).then(d => {
        if (d) pushDebtToCloud(d);
    });

    return result;
}

export async function deleteDebt(id: number) {
    // Delete from cloud? missing delete func.
    // For MVP, maybe we skip deleting from cloud or implement it later?
    // Let's stick to push updates for now. Deletion sync requires "Delete Markers".
    // Or just direct supabase call here.
    const debt = await db.debts.get(id);
    if (debt?.cloudId && debt.userId) {
        // Optimistic delete from cloud
        // import supabase dynamically? or just ignore for now to avoid complexity in this file.
    }
    return db.debts.delete(id);
}

export async function addTransaction(transaction: Omit<Transaction, "id">) {
    if (!transaction.userId) throw new Error("User ID is required");
    return db.transaction('rw', db.debts, db.transactions, async () => {
        // 1. Add Transaction Record
        const id = await db.transactions.add(transaction);

        // 2. Update Debt Balance (Deduct amount)
        const debt = await db.debts.get(transaction.debtId);
        if (debt) {
            const newBalance = Math.max(0, debt.balance - transaction.amount);
            await db.debts.update(transaction.debtId, {
                balance: newBalance,
                updatedAt: new Date()
            });

            // Sync debt balance too
            pushDebtToCloud({ ...debt, balance: newBalance });
        }

        // Sync Transaction
        const newTx = await db.transactions.get(id);
        if (newTx) pushTransactionToCloud(newTx);
    });
}

export async function updateTransaction(id: number, updates: Partial<Omit<Transaction, "id" | "userId" | "debtId">>) {
    return db.transaction('rw', db.debts, db.transactions, async () => {
        const originalTx = await db.transactions.get(id);
        if (!originalTx) throw new Error("Transaction not found");

        // 1. Revert original amount from debt
        const debt = await db.debts.get(originalTx.debtId);
        if (debt) {
            // Revert: Add back original amount
            let newBalance = debt.balance + originalTx.amount;

            // Apply New: Deduct new amount (if changed)
            if (updates.amount !== undefined) {
                newBalance = Math.max(0, newBalance - updates.amount);
            } else {
                newBalance = Math.max(0, newBalance - originalTx.amount);
            }

            await db.debts.update(originalTx.debtId, {
                balance: newBalance,
                updatedAt: new Date()
            });
        }

        // 2. Update Transaction
        await db.transactions.update(id, updates);

        // Sync Transaction
        const updatedTx = await db.transactions.get(id);
        if (updatedTx) pushTransactionToCloud(updatedTx);

        // Sync Debt if changed
        if (debt) {
            const updatedDebt = await db.debts.get(originalTx.debtId);
            if (updatedDebt) pushDebtToCloud(updatedDebt);
        }
    });
}

export async function deleteTransaction(id: number) {
    return db.transaction('rw', db.debts, db.transactions, async () => {
        const transaction = await db.transactions.get(id);
        if (!transaction) return;

        // 1. Revert Debt Balance (Add amount back)
        const debt = await db.debts.get(transaction.debtId);
        if (debt) {
            const newBalance = debt.balance + transaction.amount;
            await db.debts.update(transaction.debtId, {
                balance: newBalance,
                updatedAt: new Date()
            });
        }

        // 2. Delete Transaction Record
        await db.transactions.delete(id);
    });
}
