"use client";

import { useDebts, useAllTransactions } from "@/hooks/use-debts";
import { useBudget } from "@/hooks/use-budget";
import { usePaymentPlan } from "@/hooks/use-plan";
import { generatePlan } from "@/lib/planning-engine";
import { BurnDownChart } from "@/components/analytics/BurnDownChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { InterestPrincipalChart } from "@/components/report/InterestPrincipalChart";

export default function ReportsPage() {
    const debts = useDebts();
    const budget = useBudget();
    const planConfig = usePaymentPlan();
    const transactions = useAllTransactions();
    const { formatMoney } = useCurrency();

    const { chartData, interestData, metrics } = useMemo(() => {
        if (!debts || !budget) return { chartData: [], interestData: [], metrics: null };

        // 1. Generate the Projected Plan (The "Ideal" Path)
        const plan = generatePlan(debts, budget, planConfig);

        // --- Data for Burn Down Chart ---
        const currentTotalBalance = debts.reduce((sum, d) => sum + d.balance, 0);

        type DataPoint = {
            date: string;
            projectedBalance: number;
            actualBalance?: number;
        };

        const projectedPoints: DataPoint[] = plan.map(p => ({
            date: p.date.toISOString(),
            projectedBalance: p.debts.reduce((s, d) => s + d.endBalance, 0),
        }));

        const historyPoints: DataPoint[] = [];
        let runningBalance = currentTotalBalance;
        const sortedTx = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        historyPoints.push({
            date: new Date().toISOString(),
            actualBalance: currentTotalBalance,
            projectedBalance: currentTotalBalance
        });

        sortedTx.forEach(tx => {
            if (tx.type === 'payment') {
                runningBalance += tx.amount;
            }
            historyPoints.push({
                date: new Date(tx.date).toISOString(),
                actualBalance: runningBalance,
                projectedBalance: runningBalance
            });
        });
        historyPoints.reverse();

        // --- Data for Interest vs Principal Chart ---
        const interestPoints = plan.map(p => ({
            month: p.date.toLocaleString('default', { month: 'short', year: '2-digit' }),
            interest: p.totalInterest,
            principal: p.totalPayment - p.totalInterest,
            balance: p.debts.reduce((s, d) => s + d.endBalance, 0)
        }));

        // --- Calculate "Interest Saved" vs Min Payment Baseline ---
        const baselineConfig = {
            ...planConfig,
            strategy: 'snowball',
            allocationType: 'fixed' as const,
            allocationValue: 0,
            extraIncomeAllocationType: 'fixed' as const,
            extraIncomeAllocationValue: 0
        };

        // Use 'any' cast to bypass strict PaymentPlan type check for the baseline config
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const baselinePlan = generatePlan(debts, budget, baselineConfig as any);

        const currentTotalInterest = plan.reduce((sum, p) => sum + p.totalInterest, 0);
        const baselineTotalInterest = baselinePlan.reduce((sum, p) => sum + p.totalInterest, 0);

        const interestSaved = Math.max(0, baselineTotalInterest - currentTotalInterest);
        const monthsSaved = Math.max(0, baselinePlan.length - plan.length);

        return {
            chartData: [...historyPoints, ...projectedPoints],
            interestData: interestPoints,
            metrics: {
                interestSaved,
                monthsSaved,
                payoffDate: plan.length > 0 ? plan[plan.length - 1].date : new Date()
            }
        };

    }, [debts, budget, planConfig, transactions]);

    // Loading State
    if (debts === undefined) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    // Empty State
    if (debts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <p className="text-lg text-muted-foreground">Please add some debt accounts to get started.</p>
            </div>
        );
    }

    // Missing Budget State
    if (!budget) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <p className="text-lg text-muted-foreground">Please set up your budget to see your reports.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
                <p className="text-muted-foreground">Visualize your progress and efficiency.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Interest Saved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatMoney(metrics?.interestSaved || 0)}</div>
                        <p className="text-xs text-muted-foreground">vs. Minimum Payments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Time Saved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{metrics?.monthsSaved || 0} Months</div>
                        <p className="text-xs text-muted-foreground">Earlier debt freedom</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Debt Free Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics?.payoffDate?.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </div>
                        <p className="text-xs text-muted-foreground">Estimated</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-2 md:col-span-1">
                    <CardHeader>
                        <CardTitle>Debt Burn Down</CardTitle>
                        <CardDescription>Target vs Actual Progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BurnDownChart data={chartData} />
                    </CardContent>
                </Card>

                <div className="col-span-2 md:col-span-1">
                    <InterestPrincipalChart data={interestData} />
                </div>
            </div>
        </div>
    );
}
