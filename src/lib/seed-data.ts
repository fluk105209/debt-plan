import { db } from "@/lib/db";

export async function clearDatabase(userId: string) {
    if (!userId) return;
    await db.transaction('rw', db.debts, db.budget, db.transactions, db.paymentPlan, async () => {
        await db.debts.where('userId').equals(userId).delete();
        await db.budget.where('userId').equals(userId).delete();
        await db.transactions.where('userId').equals(userId).delete();
        await db.paymentPlan.where('userId').equals(userId).delete();
    });
}

export async function seedDatabase(userId: string) {
    if (!userId) throw new Error("User ID is required for seeding data");

    await clearDatabase(userId);

    await db.transaction('rw', db.debts, db.budget, db.transactions, db.paymentPlan, async () => {
        // 2. Create Budget (Note: Step 1 is handled by clearDatabase)
        await db.budget.add({
            userId,
            salary: 50000,
            tax: 1500,
            sso: 750,
            pvd: 1500, // 3%
            otherIncome: 0,
            bonus: [], // Default empty
            expenses: {
                rent: 12000,
                food: 8000,
                transport: 3000,
                others: 5000,
                custom: [
                    { name: 'Utilities', amount: 2500 }
                ]
            },
            monthlySavingsTarget: 5000
        });

        // 3. Create Debts
        const debt1Id = await db.debts.add({
            userId,
            name: "Credit Card (KBank)",
            type: "credit_card",
            balance: 45000,
            interestRate: 16, // 16% per year
            minPaymentType: "percent",
            minPaymentValue: 10, // 10%
            dueDay: 5,
            status: "active",
            notes: "Used for online shopping",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const debt2Id = await db.debts.add({
            userId,
            name: "Personal Loan (SCB)",
            type: "personal_loan",
            balance: 150000,
            interestRate: 22,
            minPaymentType: "fixed",
            minPaymentValue: 4500,
            dueDay: 25,
            status: "active",
            notes: "Renovation loan",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const debt3Id = await db.debts.add({
            userId,
            name: "Car Loan",
            type: "car_loan",
            balance: 350000,
            interestRate: 3.5,
            minPaymentType: "fixed",
            minPaymentValue: 8500,
            dueDay: 15,
            status: "active",
            notes: "Honda Civic",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 4. Create History (Past 3 months)
        const today = new Date();
        const monthsBack = 3;

        for (let i = 0; i < monthsBack; i++) {
            // Payment for Debt 1
            await db.transactions.add({
                userId,
                debtId: debt1Id as number,
                amount: 5000,
                date: new Date(today.getFullYear(), today.getMonth() - i, 5),
                type: 'payment',
                note: `Monthly Payment - Month ${i + 1}`
            });

            // Payment for Debt 2
            await db.transactions.add({
                userId,
                debtId: debt2Id as number,
                amount: 4500,
                date: new Date(today.getFullYear(), today.getMonth() - i, 25),
                type: 'payment',
                note: `Monthly Payment - Month ${i + 1}`
            });

            // Payment for Debt 3
            await db.transactions.add({
                userId,
                debtId: debt3Id as number,
                amount: 8500,
                date: new Date(today.getFullYear(), today.getMonth() - i, 15),
                type: 'payment',
                note: `Monthly Payment - Month ${i + 1}`
            });
        }
    });
}
