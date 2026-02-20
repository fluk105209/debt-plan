"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
    month: string;
    interest: number;
    principal: number;
    balance: number;
}

interface InterestPrincipalChartProps {
    data: ChartData[];
}

export function InterestPrincipalChart({ data }: InterestPrincipalChartProps) {
    const { formatMoney } = useCurrency();
    const { t } = useLanguage();

    // Calculate totals for summary
    const totalInterest = data.reduce((sum, item) => sum + item.interest, 0);
    const totalPrincipal = data.reduce((sum, item) => sum + item.principal, 0);

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>{t("Payment Breakdown")}</CardTitle>
                <CardDescription>
                    {t("Interest vs Principal over time")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="month"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value / 1000}k`}
                            />
                            <Tooltip
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(value: any) => [formatMoney(Number(value)), ""]}
                                labelStyle={{ color: "black" }}
                                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            />
                            <Legend />
                            <Bar dataKey="principal" name={t("Principal")} stackId="a" fill="var(--chart-2)" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="interest" name={t("Interest")} stackId="a" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-bold">{t("Total Interest")}</p>
                        <p className="text-xl font-bold" style={{ color: "var(--chart-1)" }}>{formatMoney(totalInterest)}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-bold">{t("Total Principal")}</p>
                        <p className="text-xl font-bold" style={{ color: "var(--chart-2)" }}>{formatMoney(totalPrincipal)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
