"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Activity, Wallet } from "lucide-react";
import { Debt, Budget } from "@/lib/db";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface SummaryCardsProps {
    debts: Debt[] | undefined;
    budget: Budget | undefined;
}

export function SummaryCards({ debts, budget }: SummaryCardsProps) {
    const { formatMoney } = useCurrency();
    const { t } = useLanguage();
    // Simple calculations
    // 1. Min Payment Total
    const minPaymentTotal = debts
        ?.filter((d) => d.status === "active")
        .reduce((sum, d) => {
            // Logic for min payment calculation
            // If fixed payment exists, use it.
            // Else if minPaymentType is fixed, use value.
            // Else if percent, calculate % of balance.
            if (d.fixedPayment) return sum + d.fixedPayment;
            if (d.minPaymentType === "fixed") return sum + d.minPaymentValue;
            if (d.minPaymentType === "percent") return sum + (d.balance * d.minPaymentValue) / 100;
            return sum;
        }, 0) || 0;

    // 2. Fix Costs Total
    const fixCostsTotal = budget
        ? (budget.expenses?.rent || 0) +
        (budget.expenses?.food || 0) + // These might be variable, but usually part of "committed"
        (budget.expenses?.transport || 0) +
        (budget.expenses?.others || 0) +
        (budget.expenses?.custom?.reduce((s, c) => s + c.amount, 0) || 0)
        : 0;

    // 3. Net Income
    const netIncome = budget
        ? (budget.salary || 0) +
        (budget.otherIncome || 0) -
        (budget.tax || 0) -
        (budget.sso || 0) -
        (budget.pvd || 0)
        : 0;

    // 4. Free Cash (Net Income - Fix Costs - Min Payments)
    const freeCash = netIncome - fixCostsTotal - minPaymentTotal;

    // Total Debt (New Request)
    const totalDebt = debts?.reduce((sum, d) => sum + d.balance, 0) || 0;

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("Total Debt")}</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatMoney(totalDebt)}</div>
                    <p className="text-xs text-muted-foreground">
                        {t("Principal remaining")}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("Net Monthly Income")}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatMoney(netIncome)}</div>
                    <p className="text-xs text-muted-foreground">
                        {t("After tax & deductions")}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("Fixed Expenses")}</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatMoney(fixCostsTotal)}</div>
                    <p className="text-xs text-muted-foreground">
                        {t("Living costs & commitments")}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("Min Debt Payments")}</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatMoney(minPaymentTotal)}</div>
                    <p className="text-xs text-muted-foreground">
                        {t("Required to maintain credit")}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("Free Cash Flow")}</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${freeCash < 0 ? 'text-destructive' : 'text-primary'}`}>
                        {formatMoney(freeCash)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t("Available for snowball/saving")}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
