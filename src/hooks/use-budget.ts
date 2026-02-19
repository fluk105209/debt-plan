import { pushBudgetToCloud } from "@/lib/sync";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Budget } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";

export function useBudget() {
    const { user } = useAuth();
    const budget = useLiveQuery<Budget | undefined>(
        () => (user ? db.budget.where('userId').equals(user.id).first() : Promise.resolve(undefined)),
        [user]
    );
    return budget;
}

export async function saveBudget(budget: Omit<Budget, "id">) {
    if (!budget.userId) throw new Error("User ID is required");

    // Check if exists
    const existing = await db.budget.where('userId').equals(budget.userId).first();

    let id;
    if (existing && existing.id) {
        await db.budget.update(existing.id, budget);
        id = existing.id;
    } else {
        id = await db.budget.add(budget as Budget);
    }

    // Cloud Sync
    db.budget.get(id).then(b => {
        if (b) pushBudgetToCloud(b);
    });

    return id;
}
