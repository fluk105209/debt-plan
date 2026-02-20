import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentPlan } from "@/lib/db";

const mapPlan = (p: any): PaymentPlan => ({
    id: p.id,
    userId: p.user_id,
    strategy: p.strategy,
    allocationType: p.allocation_type,
    allocationValue: p.allocation_value,
    extraIncomeAllocationType: p.extra_income_allocation_type,
    extraIncomeAllocationValue: p.extra_income_allocation_value,
    customOrder: p.custom_order,
    bonusMonths: p.bonus_months_json,
    minPaymentBuffer: p.min_payment_buffer,
});

export function usePaymentPlan() {
    const { user } = useAuth();
    const [plan, setPlan] = useState<PaymentPlan | undefined>(undefined);

    useEffect(() => {
        if (!user || !supabase) return;

        const fetchPlan = async () => {
            if (!supabase) return;
            const { data, error } = await supabase
                .from('payment_plans')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) console.error("Error fetching plan:", error);
            else if (data) setPlan(mapPlan(data));
            else setPlan(undefined);
        };

        fetchPlan();

        if (!supabase) return;

        const channel = supabase
            .channel('plan_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payment_plans', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    fetchPlan();
                }
            )
            .subscribe();

        return () => {
            if (supabase) {
                supabase.removeChannel(channel);
            }
        };
    }, [user]);

    return plan;
}

export async function savePaymentPlan(plan: Omit<PaymentPlan, "id">) {
    if (!supabase) throw new Error("Database not connected");
    if (!plan.userId) throw new Error("User ID missing");

    const payload = {
        user_id: plan.userId,
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

    const { data: existing } = await supabase.from('payment_plans').select('id').eq('user_id', plan.userId).maybeSingle();

    let result;
    if (existing) {
        const { data, error } = await supabase
            .from('payment_plans')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single();
        if (error) throw error;
        result = data;
    } else {
        const { data, error } = await supabase
            .from('payment_plans')
            .insert(payload)
            .select()
            .single();
        if (error) throw error;
        result = data;
    }

    return result.id;
}
