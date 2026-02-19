"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useMemo } from "react";
import { Debt } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface DebtChartProps {
    debts: Debt[] | undefined;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export function DebtChart({ debts }: DebtChartProps) {
    const { formatMoney } = useCurrency();
    const { t } = useLanguage();
    const data = useMemo(() => {
        if (!debts || debts.length === 0) return [];
        const dataMap = new Map<string, number>();
        debts.forEach((d) => {
            if (d.status === 'active') { // Only active debts? Usually yes.
                const label = d.type.replace('_', ' ').toUpperCase(); // Simple formatting
                const current = dataMap.get(label) || 0;
                dataMap.set(label, current + d.balance);
            }
        });
        return Array.from(dataMap.entries()).map(([name, value]) => ({ name, value }));
    }, [debts]);

    if (!debts || debts.length === 0) {
        return (
            <Card className="col-span-4 h-[400px]">
                <CardHeader>
                    <CardTitle>{t("Debt Distribution")}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {t("No debts added yet.")}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-4 h-[400px]">
            <CardHeader>
                <CardTitle>{t("Debt Distribution")}</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => `${formatMoney(Number(value))}`}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
