import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Debt, Transaction } from "@/lib/db";
import { toast } from "sonner";

// Re-map Supabase Debt to App Debt (CamelCase)
const mapDebt = (d: any): Debt => ({
    id: d.id,
    userId: d.user_id,
    name: d.name,
    type: d.type,
    balance: d.balance,
    interestRate: d.interest_rate,
    minPaymentType: d.min_payment_type,
    minPaymentValue: d.min_payment_value,
    dueDay: d.due_day,
    status: d.status,
    targetPayment: d.target_payment,
    fixedPayment: d.fixed_payment,
    notes: d.notes,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
    // Advanced Interest (Future Proofing)
    promoRate: d.promo_rate,
    promoEndDate: d.promo_end_date ? new Date(d.promo_end_date) : undefined,
});

const mapTransaction = (t: any): Transaction => ({
    id: t.id,
    userId: t.user_id,
    debtId: t.debt_id,
    amount: t.amount,
    date: new Date(t.date),
    type: t.type,
    note: t.note,
    attachmentUrl: t.attachment_url,
});

export function useDebts() {
    const { user } = useAuth();
    const [debts, setDebts] = useState<Debt[]>([]);

    useEffect(() => {
        if (!user || !supabase) return;

        const fetchDebts = async () => {
            if (!supabase) return;
            const { data, error } = await supabase
                .from('debts')
                .select('*')
                .eq('user_id', user.id)
                .order('id', { ascending: true });

            if (error) console.error("Error fetching debts:", error);
            else if (data) setDebts(data.map(mapDebt));
        };

        fetchDebts();

        // Realtime Subscription
        const channel = supabase
            .channel('debts_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'debts', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    fetchDebts(); // Re-fetch on any change (Simple & Robust)
                }
            )
            .subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    }, [user]);

    return debts;
}

export function useTransactions(debtId: number | undefined) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (!user || !debtId || !supabase) return;

        const fetchTransactions = async () => {
            if (!supabase) return;
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('debt_id', debtId)
                .order('date', { ascending: false });

            if (data) setTransactions(data.map(mapTransaction));
        };

        fetchTransactions();

        const channel = supabase
            .channel(`transactions_${debtId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions', filter: `debt_id=eq.${debtId}` },
                () => fetchTransactions()
            )
            .subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    }, [user, debtId]);

    return transactions;
}

export function useAllTransactions() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (!user || !supabase) return;

        const fetchTransactions = async () => {
            if (!supabase) return;
            const { data } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (data) setTransactions(data.map(mapTransaction));
        };

        fetchTransactions();

        // Listen to all user transactions
        const channel = supabase
            .channel(`all_transactions`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
                () => fetchTransactions()
            )
            .subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    }, [user]);

    return transactions;
}

// --- Mutations ---

export async function addDebt(debt: Omit<Debt, "id" | "createdAt" | "updatedAt">) {
    if (!supabase) throw new Error("Database not connected");

    // Map to snake_case for Supabase
    const payload = {
        user_id: debt.userId,
        name: debt.name,
        type: debt.type,
        balance: debt.balance,
        interest_rate: debt.interestRate,
        min_payment_type: debt.minPaymentType,
        min_payment_value: debt.minPaymentValue,
        due_day: debt.dueDay,
        status: debt.status,
        target_payment: debt.targetPayment,
        fixed_payment: debt.fixedPayment,
        notes: debt.notes,
        promo_rate: debt.promoRate,
        promo_end_date: debt.promoEndDate ? debt.promoEndDate.toISOString() : null
    };

    const { data, error } = await supabase.from('debts').insert(payload).select().single();
    if (error) throw error;
    return data.id;
}

export async function updateDebt(id: number, changes: Partial<Debt>) {
    if (!supabase) return;

    // Convert camel to snake manually for partial updates
    const payload: any = {};
    if (changes.name !== undefined) payload.name = changes.name;
    if (changes.type !== undefined) payload.type = changes.type;
    if (changes.balance !== undefined) payload.balance = changes.balance;
    if (changes.interestRate !== undefined) payload.interest_rate = changes.interestRate;
    if (changes.minPaymentType !== undefined) payload.min_payment_type = changes.minPaymentType;
    if (changes.minPaymentValue !== undefined) payload.min_payment_value = changes.minPaymentValue;
    if (changes.dueDay !== undefined) payload.due_day = changes.dueDay;
    if (changes.status !== undefined) payload.status = changes.status;
    if (changes.targetPayment !== undefined) payload.target_payment = changes.targetPayment;
    if (changes.fixedPayment !== undefined) payload.fixed_payment = changes.fixedPayment;
    if (changes.notes !== undefined) payload.notes = changes.notes;
    // Promo fields
    if (changes.promoRate !== undefined) payload.promo_rate = changes.promoRate;
    if (changes.promoEndDate !== undefined) payload.promo_end_date = changes.promoEndDate ? changes.promoEndDate.toISOString() : null;

    payload.updated_at = new Date().toISOString();

    const { error } = await supabase.from('debts').update(payload).eq('id', id);
    if (error) throw error;
}

export async function deleteDebt(id: number) {
    if (!supabase) return;
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) throw error;
}

export async function addTransaction(transaction: Omit<Transaction, "id">) {
    if (!supabase) throw new Error("Database not connected");

    // 1. Insert Transaction
    const { data: tx, error: txError } = await supabase.from('transactions').insert({
        user_id: transaction.userId,
        debt_id: transaction.debtId,
        amount: transaction.amount,
        date: transaction.date.toISOString(),
        type: transaction.type,
        note: transaction.note,
        attachment_url: transaction.attachmentUrl
    }).select().single();

    if (txError) throw txError;

    // 2. Update Debt Balance
    // Fetch current debt to get balance
    const { data: debt } = await supabase.from('debts').select('balance').eq('id', transaction.debtId).single();
    if (debt) {
        const newBalance = Math.max(0, debt.balance - transaction.amount);
        await supabase.from('debts').update({ balance: newBalance }).eq('id', transaction.debtId);
    }

    return tx.id;
}

export async function updateTransaction(id: number, updates: Partial<Transaction>) {
    if (!supabase) return;

    // 1. Get original tx to revert balance
    const { data: originalTx } = await supabase.from('transactions').select('*').eq('id', id).single();
    if (!originalTx) throw new Error("Transaction not found");

    const originalAmount = originalTx.amount;
    const newAmount = updates.amount !== undefined ? updates.amount : originalAmount;

    // 2. Update Debt Balance
    const { data: debt } = await supabase.from('debts').select('balance').eq('id', originalTx.debt_id).single();
    if (debt) {
        // Revert old, apply new
        const reverted = debt.balance + originalAmount;
        const newBalance = Math.max(0, reverted - newAmount);
        await supabase.from('debts').update({ balance: newBalance }).eq('id', originalTx.debt_id);
    }

    // 3. Update Transaction Record
    const payload: any = {};
    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.date !== undefined) payload.date = updates.date.toISOString();
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.note !== undefined) payload.note = updates.note;

    await supabase.from('transactions').update(payload).eq('id', id);
}

export async function deleteTransaction(id: number) {
    if (!supabase) return;

    // 1. Get transaction to revert balance
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).single();
    if (!tx) return;

    // 2. Revert Balance
    const { data: debt } = await supabase.from('debts').select('balance').eq('id', tx.debt_id).single();
    if (debt) {
        await supabase.from('debts').update({ balance: debt.balance + tx.amount }).eq('id', tx.debt_id);
    }

    // 3. Delete
    await supabase.from('transactions').delete().eq('id', id);
}
