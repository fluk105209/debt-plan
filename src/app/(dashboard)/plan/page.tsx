"use client";

import { useDebts } from "@/hooks/use-debts";
import { useBudget } from "@/hooks/use-budget";
import { usePaymentPlan, savePaymentPlan } from "@/hooks/use-plan";
import { generatePlan } from "@/lib/planning-engine";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PlanPage() {
    const { user } = useAuth();
    const { formatMoney } = useCurrency();
    const { t } = useLanguage();
    const debts = useDebts();
    const budget = useBudget();
    const planConfig = usePaymentPlan();
    const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

    const plan = useMemo(() => {
        if (!debts || !budget) return [];
        return generatePlan(debts, budget, planConfig);
    }, [debts, budget, planConfig]);

    // Loading state only if debts is undefined (initial load)
    if (debts === undefined) return <div>Loading...</div>;

    // Empty state if no debts (even if budget exists or not)
    if (debts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <p className="text-lg text-muted-foreground">{t("Please add some debt accounts to generate your plan.")}</p>
            </div>
        );
    }

    // If we have debts but no budget, show message
    if (!budget) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <p className="text-lg text-muted-foreground">{t("Please configure your budget to generate your plan.")}</p>
            </div>
        );
    }

    const payoffDate = plan.length > 0 ? plan[plan.length - 1].date : new Date();

    const handleStrategyChange = (val: string) => {
        if (!user) {
            // Ideally show toast here, but for now just return
            return;
        }
        // Save strategy
        savePaymentPlan({
            userId: user.id,
            strategy: val as 'snowball' | 'avalanche',
            customOrder: [],
            bonusMonths: [],
            minPaymentBuffer: 0
        });
    };

    const toggleMonth = (index: number) => {
        if (expandedMonth === index) {
            setExpandedMonth(null);
        } else {
            setExpandedMonth(index);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t("Monthly Payoff Plan")}</h2>
                    <p className="text-muted-foreground">
                        {t("projected debt freedom by")} <strong>{format(payoffDate, "MMMM yyyy")}</strong>
                    </p>
                </div>
                <div className="w-[200px]">
                    <Select
                        value={planConfig?.strategy || 'snowball'}
                        onValueChange={handleStrategyChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t("Strategy")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="snowball">{t("Snowball (Smallest Balance)")}</SelectItem>
                            <SelectItem value="avalanche">{t("Avalanche (Highest Interest)")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("Detailed Timeline")}</CardTitle>
                    <CardDescription>
                        {t("Based on your current budget and debts.")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("Month")}</TableHead>
                                <TableHead className="text-right">{t("Total Payment")}</TableHead>
                                <TableHead className="text-right">{t("Interest Paid")}</TableHead>
                                <TableHead className="text-right">{t("Remaining Balance")}</TableHead>
                                <TableHead className="text-right">{t("Accumulated Cash")}</TableHead>
                                <TableHead>{t("Notes")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plan.map((month) => {
                                const totalBalance = month.debts.reduce((s, d) => s + d.endBalance, 0);
                                const isExpanded = expandedMonth === month.monthIndex;

                                return (
                                    <React.Fragment key={month.monthIndex}>
                                        <TableRow
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => toggleMonth(month.monthIndex)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center">
                                                    {isExpanded ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                                                    {format(month.date, "MMM yyyy")}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 font-bold">
                                                {formatMoney(month.totalPayment)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-500">
                                                {formatMoney(Math.round(month.totalInterest))}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatMoney(Math.round(totalBalance))}
                                            </TableCell>
                                            <TableCell className="text-right text-blue-500 font-medium">
                                                {formatMoney(month.accumulatedCash)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">
                                                    {month.debts.filter(d => d.actualPayment > 0).length} {t("payments")}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                        {isExpanded && (
                                            <TableRow className="bg-muted/30">
                                                <TableCell colSpan={6} className="p-4">
                                                    <div className="rounded-md border bg-background p-2">
                                                        <h4 className="mb-2 text-sm font-semibold">{t("Payment Breakdown")}</h4>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="h-8">
                                                                    <TableHead className="py-1 h-8">{t("Debt")}</TableHead>
                                                                    <TableHead className="py-1 h-8 text-right">{t("Payment")}</TableHead>
                                                                    <TableHead className="py-1 h-8 text-right">{t("Interest")}</TableHead>
                                                                    <TableHead className="py-1 h-8 text-right">{t("Remaining")}</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {month.debts.filter(d => d.startBalance > 0 || d.actualPayment > 0).map(debt => (
                                                                    <TableRow key={debt.id} className="h-8 border-none hover:bg-transparent">
                                                                        <TableCell className="py-1 font-medium text-xs">{debt.name}</TableCell>
                                                                        <TableCell className="py-1 text-right text-xs">{formatMoney(debt.actualPayment)}</TableCell>
                                                                        <TableCell className="py-1 text-right text-xs text-muted-foreground">{formatMoney(Math.round(debt.interest))}</TableCell>
                                                                        <TableCell className="py-1 text-right text-xs">{formatMoney(Math.round(debt.endBalance))}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                        <div className="mt-2 text-xs text-muted-foreground text-right">
                                                            {t("Free Cash Left")}: {formatMoney(month.remainingCash)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody >
                    </Table >
                </CardContent >
            </Card >
        </div >
    );
}
