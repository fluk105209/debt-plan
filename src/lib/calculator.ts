import { Debt } from "./db";

export function calculateMinPayment(debt: Debt): number {
    if (debt.status === 'closed') return 0;

    if (debt.fixedPayment) {
        return debt.fixedPayment;
    }

    if (debt.minPaymentType === 'fixed') {
        return debt.minPaymentValue;
    }

    // percent
    const calculated = (debt.balance * debt.minPaymentValue) / 100;
    // Usually there is a floor for min payment (e.g. 500-1000 THB), but for now use calculated.
    // We could add a 'minAmount' field to Debt if needed.
    return Math.max(calculated, 0); // Ensure non-negative
}

export function getEffectiveInterestRate(debt: Debt, date: Date = new Date()): number {
    if (debt.promoRate !== undefined && debt.promoRate !== null && debt.promoEndDate) {
        // Check if date is before or on promoEndDate
        // specific comparison: compare YYYY-MM-DD or just timestamps?
        // Let's being generous: if the month is same or before.
        if (date.getTime() <= debt.promoEndDate.getTime()) {
            return debt.promoRate;
        }
    }
    return debt.interestRate;
}

export function calculateMonthlyInterest(debt: Debt, date: Date = new Date()): number {
    if (debt.status === 'closed') return 0;

    const rate = getEffectiveInterestRate(debt, date);

    // Simple interest: (Rate / 12) * Balance
    return (debt.balance * (rate / 100)) / 12;
}

export function estimatePayoffMonths(debt: Debt, monthlyPayment: number): number {
    if (monthlyPayment <= 0 || debt.balance <= 0) return 0;

    // N = -log(1 - (r * P) / A) / log(1 + r)
    // r = monthly rate, P = principal, A = monthly payment
    const r = debt.interestRate / 100 / 12;
    const P = debt.balance;
    const A = monthlyPayment;

    if (A <= P * r) {
        return Infinity; // Payment covers only interest or less
    }

    const n = -Math.log(1 - (r * P) / A) / Math.log(1 + r);
    return Math.ceil(n);
}
