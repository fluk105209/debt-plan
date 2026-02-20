"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addTransaction } from "@/hooks/use-debts";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Debt } from "@/lib/db";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be positive"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date",
    }),
    note: z.string().optional(),
});

interface PaymentDialogProps {
    debt: Debt | undefined;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PaymentDialog({ debt, open, onOpenChange }: PaymentDialogProps) {
    const { user } = useAuth();
    const { currency, formatMoney } = useCurrency();
    const { t } = useLanguage();
    const form = useForm<z.infer<typeof formSchema>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            amount: 0,
            date: format(new Date(), "yyyy-MM-dd"),
            note: "",
        },
    });

    // Reset form when debt changes or dialog opens
    useEffect(() => {
        if (debt && open) {
            // Suggest default payment? Maybe minPayment?
            // For now, let's leave it 0 or set to minPaymentValue if available/applicable
            const suggested = debt.minPaymentType === 'fixed' ? debt.minPaymentValue : 0;
            form.reset({
                amount: suggested,
                date: format(new Date(), "yyyy-MM-dd"),
                note: "",
            });
        }
    }, [debt, open, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!debt || !debt.id) return;

        try {
            if (!user) {
                toast.error("You must be logged in to record usage");
                return;
            }
            await addTransaction({
                userId: user.id,
                debtId: debt.id,
                amount: values.amount,
                date: new Date(values.date),
                type: 'payment',
                note: values.note,
            });
            toast.success(`Payment of ${formatMoney(values.amount)} recorded!`);
            onOpenChange(false);
            form.reset();
        } catch (error) {
            console.error("Failed to record payment:", error);
            toast.error("Failed to record payment");
        }
    }

    if (!debt) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-lg mx-auto sm:w-full sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("Record Payment")}</DialogTitle>
                    <DialogDescription>
                        {t("Log a payment for")} <span className="font-semibold">{debt.name}</span>.
                        {t("This will deduct from the current balance.")}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Amount")} ({currency})</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Date")}</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Note (Optional)")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("e.g. February Installment")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">{t("Confirm Payment")}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
