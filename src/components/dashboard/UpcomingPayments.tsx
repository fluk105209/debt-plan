"use client";

import { useDebts, useAllTransactions } from "@/hooks/use-debts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, CreditCard, CalendarClock } from "lucide-react";
import { useState, useMemo } from "react";
import { Debt } from "@/lib/db";
import { PaymentDialog } from "@/components/debts/PaymentDialog";
import { format, addMonths } from "date-fns";

interface PaymentStatus {
    debt: Debt;
    paid: boolean;
    dueDate: Date;
}

export function UpcomingPayments() {
    const debts = useDebts();
    const transactions = useAllTransactions();
    const { formatMoney } = useCurrency();
    const { t } = useLanguage();
    const [payingDebt, setPayingDebt] = useState<Debt | undefined>(undefined);
    const [isPayOpen, setIsPayOpen] = useState(false);

    // Filter active debts and check payment status
    const paymentStatus: PaymentStatus[] = useMemo(() => {
        if (!debts || !transactions) return [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return debts
            .filter((d) => d.status === 'active')
            .map((debt) => {
                // Check if any payment was made this month
                const paidThisMonth = transactions.some((t) => {
                    const tDate = new Date(t.date);
                    return t.debtId === debt.id &&
                        t.type === 'payment' &&
                        tDate.getMonth() === currentMonth &&
                        tDate.getFullYear() === currentYear;
                });

                // Calculate Due Date Logic
                const today = new Date();
                let dueDate = new Date(today.getFullYear(), today.getMonth(), debt.dueDay);

                // If the due day is in the past BUT we haven't paid, it's technically overdue, keep it this month.
                // If we HAVE paid, the next due date is next month.
                if (paidThisMonth) {
                    dueDate = addMonths(dueDate, 1);
                } else if (today.getDate() > debt.dueDay) {
                    // Keep as this month (Overdue)
                }

                return {
                    debt,
                    paid: paidThisMonth,
                    dueDate
                };
            })
            .sort((a, b) => {
                // Sort: Unpaid first, then by due date
                if (a.paid === b.paid) {
                    return a.dueDate.getTime() - b.dueDate.getTime();
                }
                return a.paid ? 1 : -1;
            });
    }, [debts, transactions]);

    const handlePay = (debt: Debt) => {
        setPayingDebt(debt);
        setIsPayOpen(true);
    };

    if (!debts || debts.length === 0) {
        return null;
    }

    return (
        <>
            <Card className="col-span-3 h-[400px] flex flex-col">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <CalendarClock className="h-5 w-5 text-primary" />
                                {t("Upcoming Payments")}
                            </CardTitle>
                            <CardDescription>
                                {t("Track your monthly obligations.")}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-3">
                        {paymentStatus.map(({ debt, paid, dueDate }) => (
                            <div
                                key={debt.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${paid ? 'bg-muted/40 border-muted opacity-60' : 'bg-card border-border shadow-sm hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${paid ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className={`font-medium text-sm ${paid ? 'line-through text-muted-foreground' : ''}`}>
                                            {debt.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{t("Due")}: {format(dueDate, "MMM d")}</span>
                                            {paid && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{t("Paid")}</Badge>}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="font-bold text-sm mb-1">
                                        {debt.minPaymentType === 'fixed'
                                            ? `${formatMoney(debt.minPaymentValue)}`
                                            : `${debt.minPaymentValue}% (${formatMoney(Math.round((debt.balance * debt.minPaymentValue) / 100))})`
                                        }
                                    </div>
                                    {!paid ? (
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                            onClick={() => handlePay(debt)}
                                        >
                                            {t("Pay")}
                                        </Button>
                                    ) : (
                                        <div className="flex justify-end text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {paymentStatus.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground h-full">
                                <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                                <p>{t("All caught up!")}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <PaymentDialog
                debt={payingDebt}
                open={isPayOpen}
                onOpenChange={(open) => {
                    setIsPayOpen(open);
                    if (!open) setPayingDebt(undefined);
                }}
            />
        </>
    );
}
