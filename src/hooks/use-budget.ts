import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Budget } from "@/lib/db";

// Map Supabase Budget to App Budget
const mapBudget = (b: any): Budget => ({
    id: b.id,
    userId: b.user_id,
    salary: b.salary,
    tax: b.tax,
    sso: b.sso,
    pvd: b.pvd,
    otherIncome: b.other_income,
    monthlySavingsTarget: b.monthly_savings_target,
    expenses: b.expenses_json,
    bonus: b.bonus_json,
});

export function useBudget() {
    const { user } = useAuth();
    const [budget, setBudget] = useState<Budget | undefined>(undefined);

    useEffect(() => {
        if (!user || !supabase) return;

        const fetchBudget = async () => {
            if (!supabase) return;
            const { data, error } = await supabase
                .from('budgets')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle(); // Budget is 1:1 user

            if (error) console.error("Error fetching budget:", error);
            else if (data) setBudget(mapBudget(data));
            else setBudget(undefined);
        };
        fetchBudget();

        if (!supabase) return;

        // Realtime Subscription
        const channel = supabase
            .channel('budget_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    fetchBudget();
                }
            )
            .subscribe();

        return () => {
            if (supabase) {
                supabase.removeChannel(channel);
            }
        };
    }, [user]);

    return budget;
}

export async function saveBudget(budget: Omit<Budget, "id">) {
    if (!supabase) throw new Error("Database not connected");
    if (!budget.userId) throw new Error("User ID missing");

    const payload = {
        user_id: budget.userId,
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

    const { data: existing } = await supabase.from('budgets').select('id').eq('user_id', budget.userId).maybeSingle();

    let result;
    if (existing) {
        // Update
        const { data, error } = await supabase
            .from('budgets')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single();
        if (error) throw error;
        result = data;
    } else {
        // Insert
        const { data, error } = await supabase
            .from('budgets')
            .insert(payload)
            .select()
            .single();
        if (error) throw error;
        result = data;
    }

    return result.id;
}
