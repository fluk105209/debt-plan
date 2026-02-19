"use client";

import { useMemo } from "react";
import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface BurnDownChartProps {
    data: {
        date: string;
        projectedBalance: number;
        actualBalance?: number; // Optional as we might not have history for all future dates
        originalBalance?: number; // For reference/ideal line
    }[];
}

export function BurnDownChart({ data }: BurnDownChartProps) {
    const { formatMoney, currency } = useCurrency();
    const { t } = useLanguage();
    const formattedData = useMemo(() => {
        return data.map(d => ({
            ...d,
            displayDate: format(new Date(d.date), "MMM yy"),
        }));
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <Card className="h-[400px] flex items-center justify-center text-muted-foreground">
                {t("No data available for Burn Down Chart.")}
            </Card>
        );
    }

    return (
        <Card className="h-[500px] flex flex-col">
            <CardHeader>
                <CardTitle>{t("Debt Burn Down")}</CardTitle>
                <CardDescription>
                    {t("Projected vs. Actual debt reduction over time.")}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={formattedData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 10,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                        <XAxis
                            dataKey="displayDate"
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            tickFormatter={(value) => `${currency === 'THB' ? '฿' : currency} ${(value / 1000).toFixed(0)}k`}
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "white",
                                borderColor: "#e2e8f0",
                                borderRadius: "8px",
                                color: "#0f172a",
                                fontSize: "12px",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                zIndex: 1000,
                                opacity: 1
                            }}
                            itemStyle={{
                                color: "#0f172a"
                            }}
                            formatter={(value: any) => [`${formatMoney(Number(value))}`, ""]}
                            labelFormatter={(label) => label}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />

                        {/* Projected Path (Area) - Shows the "Plan" area */}
                        <Area
                            type="monotone"
                            dataKey="projectedBalance"
                            name={t("Projected Balance")}
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary)/0.1)"
                            strokeWidth={2}
                            fillOpacity={1}
                        />

                        {/* Actual Path (Line) - Shows actual progress */}
                        {/* Note: In a real app, this would be partially filled data */}
                        {data.some(d => d.actualBalance !== undefined) && (
                            <Line
                                type="monotone"
                                dataKey="actualBalance"
                                name={t("Actual Balance")}
                                stroke="#10b981" // Green
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                                connectNulls
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
