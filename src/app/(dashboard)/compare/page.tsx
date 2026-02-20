"use client";

import { useDebts } from "@/hooks/use-debts";
import { useBudget } from "@/hooks/use-budget";
import { usePaymentPlan } from "@/hooks/use-plan";
import { generatePlan } from "@/lib/planning-engine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import { PaymentPlan } from "@/lib/db";

export default function ComparePage() {
    const { t } = useLanguage();
    const { formatMoney } = useCurrency();
    const debts = useDebts();
    const budget = useBudget();
    const currentPlanConfig = usePaymentPlan();

    const [strategyA, setStrategyA] = useState<string>('snowball');
    const [strategyB, setStrategyB] = useState<string>('avalanche');

    // Create configs for comparison
    const configA = useMemo(() => {
        if (!currentPlanConfig) return undefined;
        return { ...currentPlanConfig, strategy: strategyA as any } as PaymentPlan;
    }, [currentPlanConfig, strategyA]);

    const configB = useMemo(() => {
        if (!currentPlanConfig) return undefined;
        return { ...currentPlanConfig, strategy: strategyB as any } as PaymentPlan;
    }, [currentPlanConfig, strategyB]);

    // Generate Plans
    const planA = useMemo(() => {
        if (!debts || !budget || !configA) return [];
        return generatePlan(debts, budget, configA);
    }, [debts, budget, configA]);

    const planB = useMemo(() => {
        if (!debts || !budget || !configB) return [];
        return generatePlan(debts, budget, configB);
    }, [debts, budget, configB]);

    // Metrics Helper
    const getMetrics = (plan: typeof planA) => {
        if (plan.length === 0) return { date: null, interest: 0, cash: 0 };
        const lastMonth = plan[plan.length - 1];
        const totalInterest = plan.reduce((sum, m) => sum + m.totalInterest, 0);
        return {
            date: lastMonth.date,
            interest: totalInterest,
            cash: 0 // Cash flow is same unless we change allocation, simplifying for now
        };
    };

    const metricsA = getMetrics(planA);
    const metricsB = getMetrics(planB);

    // Prepare Chart Data
    const chartData = useMemo(() => {
        const maxLength = Math.max(planA.length, planB.length);
        const data = [];
        for (let i = 0; i < maxLength; i++) {
            const date = planA[i]?.date || planB[i]?.date;
            if (!date) continue;

            const balA = planA[i]
                ? planA[i].debts.reduce((s, d) => s + d.endBalance, 0)
                : 0;

            const balB = planB[i]
                ? planB[i].debts.reduce((s, d) => s + d.endBalance, 0)
                : 0;

            data.push({
                name: format(date, 'MMM yy'),
                [t("Scenario A")]: Math.round(balA),
                [t("Scenario B")]: Math.round(balB),
            });
        }
        return data;
    }, [planA, planB, t]);

    // Loading state
    if (debts === undefined || !budget || !currentPlanConfig) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">{t("Loading...")}</p>
            </div>
        );
    }

    // Empty state
    if (debts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <p className="text-lg text-muted-foreground">{t("Please add some debt accounts to get started.")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{t("Compare Scenarios")}</h2>
                <p className="text-muted-foreground">{t("Simulate different financial situations and strategies.")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Scenario A */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{t("Scenario A")}</CardTitle>
                            <Select value={strategyA} onValueChange={setStrategyA}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="snowball">Snowball</SelectItem>
                                    <SelectItem value="avalanche">Avalanche</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("Debt Free Date")}</p>
                            <p className="text-2xl font-bold">
                                {metricsA.date ? format(metricsA.date, "MMM yyyy") : "-"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("Total Interest")}</p>
                            <p className="text-xl font-semibold text-red-500">
                                {formatMoney(Math.round(metricsA.interest))}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Scenario B */}
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{t("Scenario B")}</CardTitle>
                            <Select value={strategyB} onValueChange={setStrategyB}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="snowball">Snowball</SelectItem>
                                    <SelectItem value="avalanche">Avalanche</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("Debt Free Date")}</p>
                            <p className="text-2xl font-bold">
                                {metricsB.date ? format(metricsB.date, "MMM yyyy") : "-"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("Total Interest")}</p>
                            <p className="text-xl font-semibold text-red-500">
                                {formatMoney(Math.round(metricsB.interest))}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Comparison Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Balance Projection</CardTitle>
                    <CardDescription>Comparing total remaining debt over time.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="name"
                                className="text-xs text-muted-foreground"
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                className="text-xs text-muted-foreground"
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                formatter={(value: number | undefined) => [formatMoney(value || 0), ""]}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey={t("Scenario A")}
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey={t("Scenario B")}
                                stroke="#22c55e"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
