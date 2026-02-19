"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDebt, updateDebt } from "@/hooks/use-debts";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { Debt } from "@/lib/db";
import { toast } from "sonner";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    type: z.enum([
        "credit_card",
        "personal_loan",
        "paylater",
        "car_loan",
        "motorcycle_loan",
        "bank_loan",
        "other",
    ]),
    balance: z.coerce.number().min(0, "Balance must be positive"),
    interestRate: z.coerce.number().min(0, "Interest rate must be positive"),
    minPaymentType: z.enum(["percent", "fixed"]),
    minPaymentValue: z.coerce.number().min(0, "Value must be positive"),
    dueDay: z.coerce.number().min(1).max(31),
});

interface DebtFormDialogProps {
    debtToEdit?: Debt;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    showTrigger?: boolean;
}

export function DebtFormDialog({ debtToEdit, open: controlledOpen, onOpenChange: setControlledOpen, trigger, showTrigger = true }: DebtFormDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const { user } = useAuth();
    const { currency } = useCurrency();
    const { t } = useLanguage();

    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

    const form = useForm<z.infer<typeof formSchema>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            type: "credit_card",
            balance: 0,
            interestRate: 16,
            minPaymentType: "percent",
            minPaymentValue: 5,
            dueDay: 1,
        },
    });

    useEffect(() => {
        if (isOpen && debtToEdit) {
            form.reset({
                name: debtToEdit.name,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: debtToEdit.type as any,
                balance: debtToEdit.balance,
                interestRate: debtToEdit.interestRate,
                minPaymentType: debtToEdit.minPaymentType,
                minPaymentValue: debtToEdit.minPaymentValue,
                dueDay: debtToEdit.dueDay,
            });
        } else if (isOpen && !debtToEdit) {
            form.reset({
                name: "",
                type: "credit_card",
                balance: 0,
                interestRate: 16,
                minPaymentType: "percent",
                minPaymentValue: 5,
                dueDay: 1,
            });
        }
    }, [isOpen, debtToEdit, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (debtToEdit && debtToEdit.id) {
                await updateDebt(debtToEdit.id, { ...values, status: debtToEdit.status });
                toast.success(t("Debt updated successfully"));
            } else {
                if (!user) {
                    toast.error(t("You must be logged in to add a debt"));
                    return;
                }
                await addDebt({
                    ...values,
                    userId: user.id,
                    status: "active",
                });
                toast.success(t("Debt added successfully"));
            }
            setOpen(false);
            form.reset();
        } catch (error) {
            console.error("Failed to save debt:", error);
            toast.error(t("Failed to save debt"));
        }
    }

    const isEdit = !!debtToEdit;

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            {!trigger && !isEdit && showTrigger && (
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t("Add Debt")}
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? t("Edit Debt") : t("Add New Debt")}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? t("Update the details of your debt account.") : t("Enter the details of your debt account here.")}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Account Name")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("e.g. KBank Credit Card")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("Type")}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("Select type")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="credit_card">{t("Credit Card")}</SelectItem>
                                                <SelectItem value="personal_loan">{t("Personal Loan")}</SelectItem>
                                                <SelectItem value="paylater">{t("PayLater")}</SelectItem>
                                                <SelectItem value="car_loan">{t("Car Loan")}</SelectItem>
                                                <SelectItem value="motorcycle_loan">{t("Motorcycle Loan")}</SelectItem>
                                                <SelectItem value="bank_loan">{t("Bank Loan")}</SelectItem>
                                                <SelectItem value="other">{t("Other")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="balance"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("Balance")} ({currency})</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="interestRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("Interest (%)")}</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dueDay"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("Due Day")}</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" max="31" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="minPaymentType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("Min Pay Type")}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("Method")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="percent">{t("% of Balance")}</SelectItem>
                                                <SelectItem value="fixed">{t("Fixed Amount")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="minPaymentValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("Min Value")}</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">{isEdit ? t("Update") : t("Save Access")}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
