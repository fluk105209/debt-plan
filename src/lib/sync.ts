import { supabase } from "@/lib/supabase";
import { db, Debt, Budget, PaymentPlan, Transaction } from "@/lib/db";
import { toast } from "sonner";

// --- Sync DEBTS ---
export async function pushDebtToCloud(debt: Debt) {
    if (!supabase) return;
    const { userId, id, cloudId, ...data } = debt;

    const payload = {
        user_id: userId,
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
        updated_at: new Date().toISOString()
    };

    try {
        let result;
        if (cloudId) {
            // Update existing
            const { data: updated, error } = await supabase
                .from('debts')
                .update(payload)
                .eq('id', cloudId)
                .select()
                .single();

            if (error) throw error;
            result = updated;
        } else {
            // Insert new
            const { data: inserted, error } = await supabase
                .from('debts')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            result = inserted;

            // Update local with cloudId
            if (id && result) {
                await db.debts.update(id, { cloudId: result.id });
            }
        }
    } catch (err) {
        console.error("Failed to push debt:", err);
    }
}

// --- Sync BUDGET ---
export async function pushBudgetToCloud(budget: Budget) {
    if (!supabase) return;
    const { userId, id, cloudId, ...data } = budget;

    const payload = {
        user_id: userId,
        salary: budget.salary,
        tax: budget.tax,
        sso: budget.sso,
        pvd: budget.pvd,
        other_income: budget.otherIncome,
        monthly_savings_target: budget.monthlySavingsTarget,
        expenses_json: budget.expenses,
        bonus_json: budget.bonus,
        updated_at: new Date().toISOString()
    };

    try {
        if (cloudId) {
            await supabase.from('budgets').update(payload).eq('id', cloudId);
        } else {
            const { data: inserted, error } = await supabase.from('budgets').insert(payload).select().single();
            if (!error && inserted && id) {
                await db.budget.update(id, { cloudId: inserted.id });
            }
        }
    } catch (err) {
        console.error("Failed to push budget:", err);
    }
}

// --- Sync PLAN ---
export async function pushPlanToCloud(plan: PaymentPlan) {
    if (!supabase) return;
    const { userId, id, cloudId, ...data } = plan;

    const payload = {
        user_id: userId,
        strategy: plan.strategy,
        allocation_type: plan.allocationType,
        allocation_value: plan.allocationValue,
        extra_income_allocation_type: plan.extraIncomeAllocationType,
        extra_income_allocation_value: plan.extraIncomeAllocationValue,
        custom_order: plan.customOrder,
        bonus_months_json: plan.bonusMonths,
        min_payment_buffer: plan.minPaymentBuffer,
        updated_at: new Date().toISOString()
    };

    try {
        if (cloudId) {
            await supabase.from('payment_plans').update(payload).eq('id', cloudId);
        } else {
            const { data: inserted, error } = await supabase.from('payment_plans').insert(payload).select().single();
            if (!error && inserted && id) {
                await db.paymentPlan.update(id, { cloudId: inserted.id });
            }
        }
    } catch (err) {
        console.error("Failed to push plan:", err);
    }
}

// --- Sync TRANSACTIONS ---
export async function pushTransactionToCloud(tx: Transaction) {
    if (!supabase) return;
    const { userId, id, cloudId, ...data } = tx;

    // We need Debt's Cloud ID for foreign key
    // If debt doesn't have cloudId yet, this will fail.
    // For MVP, we assume debt is synced first.

    // Get Debt's cloud ID
    const debt = await db.debts.get(tx.debtId);
    if (!debt || !debt.cloudId) {
        console.warn("Cannot push transaction: Debt not synced yet");
        // Try simple retry: Push Debt first?
        if (debt) await pushDebtToCloud(debt);
        // Re-fetch to get cloudId
        const updatedDebt = await db.debts.get(tx.debtId);
        if (!updatedDebt?.cloudId) return; // Give up
    }

    // now we have valid Debt Cloud ID
    // Re-fetch debt to be sure
    const validDebt = await db.debts.get(tx.debtId);
    if (!validDebt?.cloudId) return;

    const payload = {
        user_id: userId,
        debt_id: validDebt.cloudId,
        amount: tx.amount,
        date: tx.date.toISOString(),
        type: tx.type,
        note: tx.note,
        attachment_url: tx.attachmentUrl,
        created_at: new Date().toISOString() // Transactions usually immutable date
    };

    try {
        if (cloudId) {
            await supabase.from('transactions').update(payload).eq('id', cloudId);
        } else {
            const { data: inserted, error } = await supabase.from('transactions').insert(payload).select().single();
            if (!error && inserted && id) {
                // IMPORTANT: Dexie transactions table stores cloudId too
                await db.transactions.update(id, { cloudId: inserted.id });
            }
        }
    } catch (err) {
        console.error("Failed to push transaction:", err);
    }
}


// --- PULL (Sync Down) ---
export async function pullFromCloud(userId: string) {
    if (!supabase) return;

    try {
        // 1. Debts
        const { data: cloudDebts } = await supabase.from('debts').select('*').eq('user_id', userId);
        if (cloudDebts) {
            await db.transaction('rw', db.debts, async () => {
                await db.debts.where('userId').equals(userId).delete();

                for (const cd of cloudDebts) {
                    await db.debts.add({
                        cloudId: cd.id,
                        userId: cd.user_id,
                        name: cd.name,
                        type: cd.type, // Cast?
                        balance: cd.balance,
                        interestRate: cd.interest_rate,
                        minPaymentType: cd.min_payment_type, // Map snake to camel
                        minPaymentValue: cd.min_payment_value,
                        dueDay: cd.due_day,
                        status: cd.status,
                        targetPayment: cd.target_payment,
                        fixedPayment: cd.fixed_payment,
                        notes: cd.notes,
                        createdAt: new Date(cd.created_at),
                        updatedAt: new Date(cd.updated_at),
                    } as any);
                }
            });
        }

        // 2. Budget
        const { data: cloudBudgets } = await supabase.from('budgets').select('*').eq('user_id', userId);
        if (cloudBudgets && cloudBudgets.length > 0) {
            await db.transaction('rw', db.budget, async () => {
                await db.budget.where('userId').equals(userId).delete();
                const cb = cloudBudgets[0]; // Assume 1 budget per user
                await db.budget.add({
                    cloudId: cb.id,
                    userId: cb.user_id,
                    salary: cb.salary,
                    tax: cb.tax,
                    sso: cb.sso,
                    pvd: cb.pvd,
                    otherIncome: cb.other_income,
                    monthlySavingsTarget: cb.monthly_savings_target,
                    expenses: cb.expenses_json,
                    bonus: cb.bonus_json,
                });
            });
        }

        // 3. Payment Plan
        const { data: cloudPlans } = await supabase.from('payment_plans').select('*').eq('user_id', userId);
        if (cloudPlans && cloudPlans.length > 0) {
            await db.transaction('rw', db.paymentPlan, async () => {
                await db.paymentPlan.where('userId').equals(userId).delete();
                const cp = cloudPlans[0];
                await db.paymentPlan.add({
                    cloudId: cp.id,
                    userId: cp.user_id,
                    strategy: cp.strategy as any,
                    allocationType: cp.allocation_type, // map snake to camel
                    allocationValue: cp.allocation_value,
                    extraIncomeAllocationType: cp.extra_income_allocation_type,
                    extraIncomeAllocationValue: cp.extra_income_allocation_value,
                    customOrder: cp.custom_order,
                    bonusMonths: cp.bonus_months_json,
                    minPaymentBuffer: cp.min_payment_buffer,
                });
            });
        }

        // 4. Transactions
        // Note: We need correct Local Debt IDs to link transactions.
        // We just wiped Debts and re-inserted them. The "id" (auto-inc) might have changed!
        // This is why we need to Map Cloud Debt ID -> Local Debt ID.

        // Fetch valid debts map
        const localDebts = await db.debts.where('userId').equals(userId).toArray();
        const cloudToLocalDebtId = new Map(localDebts.map(d => [d.cloudId, d.id]));

        const { data: cloudTx } = await supabase.from('transactions').select('*').eq('user_id', userId);
        if (cloudTx) {
            await db.transaction('rw', db.transactions, async () => {
                await db.transactions.where('userId').equals(userId).delete();
                for (const tx of cloudTx) {
                    const localDebtId = cloudToLocalDebtId.get(tx.debt_id);
                    if (localDebtId) {
                        await db.transactions.add({
                            cloudId: tx.id,
                            userId: tx.user_id,
                            debtId: localDebtId,
                            amount: tx.amount,
                            date: new Date(tx.date),
                            type: tx.type as any,
                            note: tx.note,
                            attachmentUrl: tx.attachment_url,
                        });
                    }
                }
            });
        }

        toast.success("Data synced from cloud!");

    } catch (err) {
        console.error("Pull failed:", err);
        toast.error("Failed to sync data");
    }
}
