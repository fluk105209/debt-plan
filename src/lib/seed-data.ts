import { supabase } from "@/lib/supabase";

export async function clearDatabase(userId: string) {
    if (!userId || !supabase) return;

    // Delete in order to avoid FK constraints if any (though likely CASCADE is on)
    await supabase.from('transactions').delete().eq('user_id', userId);
    await supabase.from('debts').delete().eq('user_id', userId);
    await supabase.from('budgets').delete().eq('user_id', userId);
    await supabase.from('payment_plans').delete().eq('user_id', userId);
}

export async function seedDatabase(userId: string) {
    if (!userId) throw new Error("User ID is required for seeding data");
    if (!supabase) throw new Error("Database not connected");

    await clearDatabase(userId);

    // 1. Create Budget
    await supabase.from('budgets').insert({
        user_id: userId,
        salary: 50000,
        tax: 1500,
        sso: 750,
        pvd: 1500, // 3%
        other_income: 0,
        bonus_json: [], // Default empty
        expenses_json: {
            rent: 12000,
            food: 8000,
            transport: 3000,
            others: 5000,
            custom: [
                { name: 'Utilities', amount: 2500 }
            ]
        },
        monthly_savings_target: 5000
    });

    // 2. Create Debts
    const { data: debt1 } = await supabase.from('debts').insert({
        user_id: userId,
        name: "Credit Card (KBank)",
        type: "credit_card",
        balance: 45000,
        interest_rate: 16, // 16% per year
        min_payment_type: "percent",
        min_payment_value: 10, // 10%
        due_day: 5,
        status: "active",
        notes: "Used for online shopping",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).select().single();

    const { data: debt2 } = await supabase.from('debts').insert({
        user_id: userId,
        name: "Personal Loan (SCB)",
        type: "personal_loan",
        balance: 150000,
        interest_rate: 22,
        min_payment_type: "fixed",
        min_payment_value: 4500,
        due_day: 25,
        status: "active",
        notes: "Renovation loan",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).select().single();

    const { data: debt3 } = await supabase.from('debts').insert({
        user_id: userId,
        name: "Car Loan",
        type: "car_loan",
        balance: 350000,
        interest_rate: 3.5,
        min_payment_type: "fixed",
        min_payment_value: 8500,
        due_day: 15,
        status: "active",
        notes: "Honda Civic",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).select().single();

    // 3. Create History (Past 3 months)
    const today = new Date();
    const monthsBack = 3;
    const transactions = [];

    for (let i = 0; i < monthsBack; i++) {
        if (debt1) {
            transactions.push({
                user_id: userId,
                debt_id: debt1.id,
                amount: 5000,
                date: new Date(today.getFullYear(), today.getMonth() - i, 5).toISOString(),
                type: 'payment',
                note: `Monthly Payment - Month ${i + 1}`
            });
        }

        if (debt2) {
            transactions.push({
                user_id: userId,
                debt_id: debt2.id,
                amount: 4500,
                date: new Date(today.getFullYear(), today.getMonth() - i, 25).toISOString(),
                type: 'payment',
                note: `Monthly Payment - Month ${i + 1}`
            });
        }

        if (debt3) {
            transactions.push({
                user_id: userId,
                debt_id: debt3.id,
                amount: 8500,
                date: new Date(today.getFullYear(), today.getMonth() - i, 15).toISOString(),
                type: 'payment',
                note: `Monthly Payment - Month ${i + 1}`
            });
        }
    }

    if (transactions.length > 0) {
        await supabase.from('transactions').insert(transactions);
    }
}
