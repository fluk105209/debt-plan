import { pushPlanToCloud } from "@/lib/sync";
import { useLiveQuery } from "dexie-react-hooks";
import { db, PaymentPlan } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";

export function usePaymentPlan() {
    const { user } = useAuth();
    const plan = useLiveQuery<PaymentPlan | undefined>(
        () => (user ? db.paymentPlan.where('userId').equals(user.id).first() : Promise.resolve(undefined)),
        [user]
    );
    return plan;
}

export async function savePaymentPlan(plan: Omit<PaymentPlan, "id">) {
    if (!plan.userId) throw new Error("User ID is required");

    const existing = await db.paymentPlan.where('userId').equals(plan.userId).first();

    let id;
    if (existing && existing.id) {
        await db.paymentPlan.update(existing.id, plan);
        id = existing.id;
    } else {
        id = await db.paymentPlan.add(plan as PaymentPlan);
    }

    // Cloud Sync
    db.paymentPlan.get(id).then(p => {
        if (p) pushPlanToCloud(p);
    });
    return id;
}
