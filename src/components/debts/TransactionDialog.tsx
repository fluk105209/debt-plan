"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateTransaction } from "@/hooks/use-debts";
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
import { Transaction } from "@/lib/db";
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

interface TransactionDialogProps {
    transaction: Transaction | undefined;
    debtName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TransactionDialog({ transaction, debtName, open, onOpenChange }: TransactionDialogProps) {
    const { user } = useAuth();
    const { currency } = useCurrency();
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

    useEffect(() => {
        if (transaction && open) {
            form.reset({
                amount: transaction.amount,
                date: format(new Date(transaction.date), "yyyy-MM-dd"),
                note: transaction.note || "",
            });
        }
    }, [transaction, open, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!transaction || !transaction.id) return;

        try {
            if (!user) {
                toast.error(t("You must be logged in to update records"));
                return;
            }

            await updateTransaction(transaction.id, {
                amount: values.amount,
                date: new Date(values.date),
                note: values.note,
            });

            toast.success(t("Transaction updated successfully"));
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update transaction:", error);
            toast.error(t("Failed to update transaction"));
        }
    }

    if (!transaction) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("Edit Transaction")}</DialogTitle>
                    <DialogDescription>
                        {t("Update payment details for")} <span className="font-semibold">{debtName}</span>.
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
                                        <Input placeholder={t("Payment note")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">{t("Save Changes")}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
