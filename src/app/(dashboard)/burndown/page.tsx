"use client";

import { useDebts, useAllTransactions } from "@/hooks/use-debts";
import { useBudget } from "@/hooks/use-budget";
import { usePaymentPlan } from "@/hooks/use-plan";
import { generatePlan } from "@/lib/planning-engine";
import { BurnDownChart } from "@/components/analytics/BurnDownChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export default function BurnDownPage() {
    const debts = useDebts();
    const budget = useBudget();
    const planConfig = usePaymentPlan();
    const transactions = useAllTransactions();

    const chartData = useMemo(() => {
        if (!debts || !budget) return [];

        // 1. Generate the Projected Plan (The "Ideal" Path)
        const plan = generatePlan(debts, budget, planConfig);

        // 2. Calculate Current Total Balance
        const currentTotalBalance = debts.reduce((sum, d) => sum + d.balance, 0);

        // 3. Reconstruct Historical Balances from Transactions
        // Logic: PastBalance = CurrentBalance + Payments - NewDebts (roughly)
        // We will simple trace back from today.

        type DataPoint = {
            date: string;
            projectedBalance: number;
            actualBalance?: number;
        };

        // A. Projected Data (Future)
        const projectedPoints: DataPoint[] = plan.map(p => ({
            date: p.date.toISOString(),
            projectedBalance: p.debts.reduce((s, d) => s + d.endBalance, 0),
        }));

        // B. Actual History (Reconstructed)
        // Group transactions by montly buckets or just raw points?
        // Let's do daily points for accuracy, but aggregated for chart smoothness?
        // Actually, let's just create points for every transaction date + today.

        const historyPoints: DataPoint[] = [];
        let runningBalance = currentTotalBalance;

        // Sort transactions descending (newest first)
        const sortedTx = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Add "Today" point
        historyPoints.push({
            date: new Date().toISOString(),
            actualBalance: currentTotalBalance,
            projectedBalance: currentTotalBalance // Anchored
        });

        // Iterate backwards
        sortedTx.forEach(tx => {
            if (tx.type === 'payment') {
                runningBalance += tx.amount; // Add back payment
            } else {
                // If it's a new debt charge, we subtracted it from balance? 
                // Wait, spending increases debt. So Past = Current - Spending.
                // But we don't typically log spending as transactions here yet?
                // Assuming 'payment' decreases balance.
                // If there are other types (e.g. 'charge'), Past = Current - Charge.
            }

            historyPoints.push({
                date: new Date(tx.date).toISOString(),
                actualBalance: runningBalance,
                projectedBalance: runningBalance // Assume on track for past data to prevent gaps
            });
        });

        // Reverse history to be chronological
        historyPoints.reverse();

        // C. Merge Key
        // We need a unified timeline.
        // For the chart, we can just concat history + projection?
        // Overlapping date (Today) is in both.

        // Let's refine the "Projected" to start from Today.
        // The generatePlan returns month-start or month-end dates? Usually month-by-month.

        // Remove the "Today" from history if it duplicates projection start?
        // Actually, let's just map history as 'actual' and projection as 'projected'.

        return [
            ...historyPoints,
            ...projectedPoints
        ];

    }, [debts, budget, planConfig, transactions]);

    // Loading state only if debts is undefined
    if (debts === undefined) return <div className="p-8">Loading data...</div>;

    // Empty state
    if (debts.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Please add some debts to see your Burn Down chart.
            </div>
        );
    }

    // Missing Budget state
    if (!budget) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Please set up your budget to see your Burn Down chart.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">

                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Burn Down Chart</h2>
                    <p className="text-muted-foreground">Visualizing your path to debt freedom.</p>
                </div>
            </div>

            <BurnDownChart data={chartData} />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>How to read this chart</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            A <strong>Burn Down Chart</strong> shows your debt decreasing over time.
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li><strong>Blue Area (Projected):</strong> The ideal path based on your current payments.</li>
                            <li><strong>Green Line (Actual):</strong> Your real progress based on recorded transactions.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
