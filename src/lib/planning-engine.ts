import { Debt, Budget, PaymentPlan } from "./db";
import { calculateMinPayment, calculateMonthlyInterest } from "./calculator";

interface MonthProjection {
    monthIndex: number;
    date: Date;
    debts: {
        id: number;
        name: string;
        startBalance: number;
        interest: number;
        minPayment: number;
        actualPayment: number;
        endBalance: number;
        status: 'active' | 'closed';
    }[];
    totalPayment: number;
    totalInterest: number;
    remainingCash: number;
    accumulatedCash: number;
}

export function generatePlan(
    debts: Debt[],
    budget: Budget,
    planConfig: PaymentPlan | undefined
): MonthProjection[] {
    // Deep copy debts to simulate
    const currentDebts = debts.map(d => ({ ...d }));
    const projection: MonthProjection[] = [];

    // Safety break
    const MAX_MONTHS = 120; // 10 years cap for MVP
    let month = 0;
    let accumulatedCash = 0;

    // Determine order based on strategy
    // Default is Snowball (lowest balance first)
    const strategy = planConfig?.strategy || 'snowball';

    // Sort function
    const sortDebts = (debts: typeof currentDebts) => {
        return debts.sort((a, b) => {
            // If custom order check that first... (omitted for MVP simplicity unless configured)

            // Secondary sort: alphabetical to be stable?
            if (strategy === 'avalanche') {
                // Highest interest first
                return b.interestRate - a.interestRate || a.balance - b.balance;
            } else {
                // Snowball: Lowest balance first
                return a.balance - b.balance || b.interestRate - a.interestRate;
            }
        });
    };

    while (currentDebts.some(d => d.balance > 0) && month < MAX_MONTHS) {
        const today = new Date();
        const currentMonthDate = new Date(today.getFullYear(), today.getMonth() + month, 1);

        // 1. Calculate Available Cash

        // A. Regular Income & Expenses
        const regularIncome = budget.salary + (budget.otherIncome || 0);

        const fixedExpenses = (budget.expenses?.rent || 0) +
            (budget.expenses?.food || 0) +
            (budget.expenses?.transport || 0) +
            (budget.expenses?.others || 0) +
            (budget.expenses?.custom?.reduce((s, c) => s + c.amount, 0) || 0);

        // Regular Free Cash (can be negative if expenses > income)
        const regularFreeCash = regularIncome - fixedExpenses - (budget.tax + budget.sso + budget.pvd);

        // B. Extra Income (Bonus)
        const currentYear = currentMonthDate.getFullYear();
        const monthNum = currentMonthDate.getMonth() + 1; // 1-12

        const monthlyBonuses = budget.bonus?.filter(b => {
            // Default to one-time if missing (backward compatibility)
            const freq = b.frequency || 'one-time';

            if (freq === 'one-time') {
                // Match Month AND Year
                // If year is missing in DB, assume current year (or next occurrence logic? safer to require year in UI)
                // For now, if year is missing, match matching month in the first projected year (today's year)
                const targetYear = b.year || new Date().getFullYear();
                return b.month === monthNum && targetYear === currentYear;
            }

            if (freq === 'yearly') {
                // Match Month only
                return b.month === monthNum;
            }

            if (freq === 'monthly') {
                // Match if current date is after or equal to start date
                // We need a "start date" logic. 
                // If we treat "month" as "start month" and "year" as "start year":
                const startYear = b.year || new Date().getFullYear();
                const startMonth = b.month;

                const isAfterStart = (currentYear > startYear) || (currentYear === startYear && monthNum >= startMonth);
                return isAfterStart;
            }

            return false;
        }) || [];

        const totalBonus = monthlyBonuses.reduce((sum, b) => sum + b.amount, 0);

        // Combine for Net Cash Flow (to cover deficits first)
        const netCashFlow = regularFreeCash + totalBonus;

        // If net cash is negative, we can't pay anything extra.
        // In reality, user dips into savings or increases debt. 
        // For this simulation, we cap at 0 for "Available for Min Payment".

        let availableForMinPayment = Math.max(netCashFlow, 0);

        // 2. Pay Minimums
        const monthDetails = {
            monthIndex: month,
            date: currentMonthDate,
            debts: [] as MonthProjection['debts'][0][], // type hack
            totalPayment: 0,
            totalInterest: 0,
            remainingCash: 0,
            accumulatedCash: 0,
        };

        // Track payment made this month for each debt
        const paymentsMade = new Map<number, number>();

        // Calculate interest and min payments for all active debts
        currentDebts.forEach(d => {
            if (d.balance <= 0) {
                d.balance = 0; // Ensure 0
                return;
            }

            const interest = calculateMonthlyInterest(d, currentMonthDate);
            d.balance += interest; // Add interest first
            monthDetails.totalInterest += interest;

            let minPay = calculateMinPayment(d);
            // If balance (which includes interest now) < minPay, just pay balance
            if (d.balance < minPay) minPay = d.balance;

            // Deduct minPay from available cash
            const payment = minPay;

            d.balance -= payment;
            availableForMinPayment -= payment;
            paymentsMade.set(d.id!, payment);

            monthDetails.debts.push({
                id: d.id!,
                name: d.name,
                startBalance: d.balance + payment - interest, // reconstruct start
                interest,
                minPayment: minPay,
                actualPayment: payment,
                endBalance: d.balance,
                status: 'active'
            });
        });

        // 3. Snowball/Avalanche (Extra Payment)
        // We now need to determine how much of the "Remaining Cash" is allocatable to debt
        // based on the TWO strategies: Regular Strategy AND Extra Income Strategy.

        let allocatableCash = 0;
        let remainingCashAfterMin = Math.max(availableForMinPayment, 0);

        if (remainingCashAfterMin > 0) {
            // Re-constitute the "sources" of this remaining cash.
            // This is tricky because Min Payments effectively "eat" from the pool fungibly.
            // Logic:
            // 1. Min Payments eat from Regular Free Cash FIRST.
            // 2. Then they eat from Bonus.

            let regularFreeCashAfterMin = regularFreeCash;
            // let bonusAfterMin = totalBonus;

            // Calculate total Min Payment
            const totalMinPayment = monthDetails.debts.reduce((sum, d) => sum + d.minPayment, 0);

            // Distribute Min Payment deduction
            if (regularFreeCashAfterMin >= totalMinPayment) {
                regularFreeCashAfterMin -= totalMinPayment;
            } else {
                // const remainder = totalMinPayment - regularFreeCashAfterMin; // amount not covered by regular
                regularFreeCashAfterMin = 0; // exhausted (or negative if we tracked it, but here we clamp at 0 effectively)
                // Actually regularFreeCash could be negative to begin with.
                // If regularFreeCash was negative, it didn't cover anything. 
                // So "regularFreeCashAfterMin" is basically "surplus from regular income available for extra debt".
            }

            // If regular income was negative, it consumed bonus.
            if (regularFreeCash < 0) {
                // bonusAfterMin += regularFreeCash; // Reduce bonus by the deficit
                regularFreeCashAfterMin = 0;
            }

            // Also deduct min payments if they weren't covered by regular
            // This logic is getting complex. Simplified Approach:
            // "Allocatable" = (Regular Surplus * Regular Rate) + (Bonus Surplus * Bonus Rate)

            // Let's assume proportional consumption? No, standard is Salary covers "Needs" (Min Payment included).
            // So:
            // 1. Net Regular Position = Salary - Expenses - MinPayments
            // 2. Net Bonus Position = Bonus

            // Calculate Net Regular Position
            const netRegular = (budget.salary + (budget.otherIncome || 0))
                - fixedExpenses
                - (budget.tax + budget.sso + budget.pvd)
                - totalMinPayment;

            let allocatableFromRegular = 0;
            if (netRegular > 0) {
                const allocType = planConfig?.allocationType || 'full';
                if (allocType === 'full') {
                    allocatableFromRegular = netRegular;
                } else if (allocType === 'percent') {
                    const pct = planConfig?.allocationValue ?? 100;
                    allocatableFromRegular = netRegular * (pct / 100);
                } else if (allocType === 'fixed') {
                    const amt = planConfig?.allocationValue ?? netRegular;
                    allocatableFromRegular = Math.min(netRegular, amt);
                }
            }

            let allocatableFromBonus = 0;
            // Bonus determines its allocatable amount based on GROSS bonus usually? 
            // Or Net Bonus after covering deficits?
            // "Extra Income Strategy" usually applies to the whole bonus if possible.
            // But we can't pay debt if we have a deficit.

            // Let's define: Bonus Available = Total Bonus + (NetRegular if negative, else 0).
            const bonusAvailable = totalBonus + Math.min(netRegular, 0);

            if (bonusAvailable > 0) {
                const extraAllocType = planConfig?.extraIncomeAllocationType || 'full';
                // If not set, default to 'full' (user expectation for windfalls often)

                if (extraAllocType === 'full') {
                    allocatableFromBonus = bonusAvailable;
                } else if (extraAllocType === 'percent') {
                    const pct = planConfig?.extraIncomeAllocationValue ?? 100;
                    allocatableFromBonus = bonusAvailable * (pct / 100);
                } else if (extraAllocType === 'fixed') {
                    const amt = planConfig?.extraIncomeAllocationValue ?? bonusAvailable;
                    allocatableFromBonus = Math.min(bonusAvailable, amt);
                }
            }

            allocatableCash = allocatableFromRegular + allocatableFromBonus;

            // Final safety check: can't allocate more than we physically have
            allocatableCash = Math.min(allocatableCash, remainingCashAfterMin);
        }

        // Apply extra payment
        if (allocatableCash > 0) {
            // Sort active debts according to strategy
            const sortedDebts = sortDebts(currentDebts.filter(d => d.balance > 0));

            for (const d of sortedDebts) {
                if (allocatableCash <= 0) break;

                // Pay as much as possible to this debt
                const amount = Math.min(d.balance, allocatableCash);

                d.balance -= amount;
                allocatableCash -= amount;
                remainingCashAfterMin -= amount; // Deduct from main freeCash as well since we used it

                // Update record
                const rec = monthDetails.debts.find(r => r.id === d.id);
                if (rec) {
                    rec.actualPayment += amount;
                    rec.endBalance = d.balance;
                }
            }
        }

        // Sum totals
        monthDetails.totalPayment = monthDetails.debts.reduce((s, d) => s + d.actualPayment, 0);
        monthDetails.remainingCash = remainingCashAfterMin;

        accumulatedCash += remainingCashAfterMin;
        monthDetails.accumulatedCash = accumulatedCash;

        projection.push(monthDetails);
        month++;
    }

    return projection;
}
