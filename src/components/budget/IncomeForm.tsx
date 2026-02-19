"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useBudget, saveBudget } from "@/hooks/use-budget";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

// I'll assume I need to install sonner or just console.log for now.
// ShadCN has 'toast' component. 'npx shadcn@latest add sonner'.
// For now, I'll allow simple alert or console.

export function IncomeForm() {
    const budget = useBudget();
    const { user } = useAuth();

    interface IncomeFormValues {
        salary: number;
        otherIncome: number;
        tax: number;
        sso: number;
        pvd: number;
    }

    const form = useForm<IncomeFormValues>({
        defaultValues: {
            salary: 0,
            otherIncome: 0,
            tax: 0,
            sso: 0,
            pvd: 0,
        },
    });

    useEffect(() => {
        if (budget) {
            form.reset({
                salary: budget.salary,
                otherIncome: budget.otherIncome,
                tax: budget.tax,
                sso: budget.sso,
                pvd: budget.pvd,
            });
        }
    }, [budget, form]);

    async function onSubmit(data: IncomeFormValues) {
        // Need to preserve existing expenses if any
        // Since Dexie 'put' replaces, we need to merge or ensure we have full object.
        // But useBudget returns the full object.
        // Actually, we should split budget into tables or store full object.
        // My definition of saveBudget takes Omit<Budget, "id">.
        // So I need to pass expenses too.

        const currentExpenses = budget?.expenses || {
            rent: 0,
            food: 0,
            transport: 0,
            others: 0,
            custom: [],
        };
        const currentBonus = budget?.bonus || [];
        const currentSavings = budget?.monthlySavingsTarget || 0;

        if (!user) {
            alert("Please login to save");
            return;
        }

        await saveBudget({
            ...data,
            userId: user.id,
            expenses: currentExpenses,
            bonus: currentBonus,
            monthlySavingsTarget: currentSavings,
        });
        alert("Income saved!");
    }

    const [pvdMode, setPvdMode] = useState<'fixed' | 'percent'>('fixed');

    // Watch salary to auto-calculate PVD if in percent mode
    const salary = form.watch("salary");
    const pvd = form.watch("pvd");

    useEffect(() => {
        if (pvdMode === 'percent') {
            // We need a way to store/retrieve the percent value. 
            // For now, let's derive it or keep it in a separate state if we want to edit it.
            // Accessing the % input value directly via a separate state 'pvdPercent'
        }
    }, [salary, pvdMode]);

    const [pvdPercent, setPvdPercent] = useState(0);

    // Update PVD amount when Salary or Percent changes
    useEffect(() => {
        if (pvdMode === 'percent') {
            const calculated = (salary * pvdPercent) / 100;
            form.setValue("pvd", calculated);
        }
    }, [salary, pvdPercent, pvdMode, form]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Income</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="salary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Base Salary</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="otherIncome"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Other Income</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="tax"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tax</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sso"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SSO</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <FormLabel>PVD</FormLabel>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-muted-foreground">Calc %</span>
                                        <Switch
                                            checked={pvdMode === 'percent'}
                                            onCheckedChange={(c) => setPvdMode(c ? 'percent' : 'fixed')}
                                        />
                                    </div>
                                </div>

                                {pvdMode === 'percent' ? (
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                type="number"
                                                placeholder="%"
                                                value={pvdPercent}
                                                onChange={(e) => setPvdPercent(Number(e.target.value))}
                                            />
                                            <span className="text-[10px] text-muted-foreground">% of Salary</span>
                                        </div>
                                        <div className="flex-1">
                                            <Input value={pvd} disabled />
                                            <span className="text-[10px] text-muted-foreground">Amount</span>
                                        </div>
                                    </div>
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="pvd"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        </div>
                        <Button type="submit">Save Income</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
