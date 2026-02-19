"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useBudget, saveBudget } from "@/hooks/use-budget";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export function ExpenseForm() {
    const budget = useBudget();
    const { user } = useAuth();

    interface ExpenseFormValues {
        rent: number;
        food: number;
        transport: number;
        others: number;
    }

    const form = useForm<ExpenseFormValues>({
        defaultValues: {
            rent: 0,
            food: 0,
            transport: 0,
            others: 0,
        },
    });

    useEffect(() => {
        if (budget && budget.expenses) {
            form.reset({
                rent: budget.expenses.rent,
                food: budget.expenses.food,
                transport: budget.expenses.transport,
                others: budget.expenses.others,
            });
        }
    }, [budget, form]);

    async function onSubmit(data: ExpenseFormValues) {
        // Merge with existing budget data
        // We need to fetch current Income fields or default them.
        // It's safer if we can update only part of the object, 
        // but Dexie 'put' replaces. 
        // So we rely on 'budget' loaded from hook.
        // Note: Concurrent edits might overwrite in this simple implementation?
        // Since it's local-first single user, usually fine.

        const currentIncome = {
            salary: budget?.salary || 0,
            otherIncome: budget?.otherIncome || 0,
            tax: budget?.tax || 0,
            sso: budget?.sso || 0,
            pvd: budget?.pvd || 0,
            bonus: budget?.bonus || [],
            monthlySavingsTarget: budget?.monthlySavingsTarget || 0,
        };

        const currentCustom = budget?.expenses?.custom || [];

        if (!user) {
            alert("Please login to save");
            return;
        }

        await saveBudget({
            ...currentIncome,
            userId: user.id,
            expenses: {
                ...data,
                custom: currentCustom
            }
        });
        alert("Expenses saved!");
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Fixed Expenses</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="rent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rent / Housing</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="food"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Food</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="transport"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transport</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="others"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Others</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit">Save Expenses</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
