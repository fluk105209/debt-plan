"use client";

import { useBudget, saveBudget } from "@/hooks/use-budget";
import { usePaymentPlan, savePaymentPlan } from "@/hooks/use-plan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Helper type for local state
interface ExtraIncomeItem {
    month: number;
    year?: number;
    amount: number;
    frequency: 'one-time' | 'monthly' | 'yearly';
}

import { useAuth } from "@/contexts/AuthContext";

export default function ScenariosPage() {
    const { user } = useAuth();
    const budget = useBudget();
    const plan = usePaymentPlan();
    const { currency } = useCurrency();

    // Extra Income State
    const [extraIncomes, setExtraIncomes] = useState<ExtraIncomeItem[]>([]);

    // Monthly Allocation State
    const [allocationType, setAllocationType] = useState<'full' | 'percent' | 'fixed'>('full');
    const [allocationValue, setAllocationValue] = useState<number>(0);

    // Extra Income Allocation State
    const [extraAllocType, setExtraAllocType] = useState<'full' | 'percent' | 'fixed'>('full');
    const [extraAllocValue, setExtraAllocValue] = useState<number>(0);

    useEffect(() => {
        if (budget) {
            // Map legacy data to new schema if needed
            const loaded = (budget.bonus || []).map(b => ({
                month: b.month,
                year: b.year || new Date().getFullYear(),
                amount: b.amount,
                frequency: (b.frequency || 'one-time') as 'one-time' | 'monthly' | 'yearly'
            }));
            setExtraIncomes(loaded);
        }
    }, [budget]);

    useEffect(() => {
        if (plan) {
            setAllocationType(plan.allocationType || 'full');
            setAllocationValue(plan.allocationValue || 0);

            setExtraAllocType(plan.extraIncomeAllocationType || 'full');
            setExtraAllocValue(plan.extraIncomeAllocationValue || 0);
        }
    }, [plan]);

    const handleAddIncome = () => {
        setExtraIncomes([...extraIncomes, {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            amount: 0,
            frequency: 'one-time'
        }]);
    };

    const handleRemoveIncome = (index: number) => {
        const newIncomes = [...extraIncomes];
        newIncomes.splice(index, 1);
        setExtraIncomes(newIncomes);
    };

    const handleIncomeChange = (index: number, field: keyof ExtraIncomeItem, value: any) => {
        const newIncomes = [...extraIncomes];
        // @ts-ignore
        newIncomes[index] = { ...newIncomes[index], [field]: value };
        setExtraIncomes(newIncomes);
    };

    // Validation handler for percentage inputs
    const handlePercentageChange = (setter: (val: number) => void, value: number) => {
        if (value < 0) setter(0);
        else if (value > 100) setter(100);
        else setter(value);
    }

    const handleSave = async () => {
        if (!budget) return;

        // Save Budget (Extra Incomes)
        await saveBudget({
            ...budget,
            bonus: extraIncomes
        });

        // Save Plan Config (Allocation)
        if (plan) {
            await savePaymentPlan({
                ...plan,
                allocationType,
                allocationValue,
                extraIncomeAllocationType: extraAllocType,
                extraIncomeAllocationValue: extraAllocValue
            });
        } else {
            if (!user) {
                toast.error("You must be logged in to save scenarios");
                return;
            }
            // Create default if missing
            await savePaymentPlan({
                userId: user.id,
                strategy: 'snowball',
                allocationType,
                allocationValue,
                extraIncomeAllocationType: extraAllocType,
                extraIncomeAllocationValue: extraAllocValue,
                customOrder: [],
                bonusMonths: [],
                minPaymentBuffer: 0
            });
        }

        toast.success("Scenarios applied! Check Monthly Plan for updates.");
    };

    const currentYear = new Date().getFullYear();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Scenarios</h2>
                <p className="text-muted-foreground">Simulate different financial situations and strategies.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Extra Income Allocation</CardTitle>
                        <CardDescription>
                            Configure bonuses/extra income and how much to use for debt.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">1. Extra Incomes</Label>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">Type</TableHead>
                                        <TableHead>Start Time</TableHead>
                                        <TableHead>Amount ({currency})</TableHead>
                                        <TableHead className="w-[40px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {extraIncomes.map((income, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Select
                                                    value={income.frequency}
                                                    onValueChange={(v) => handleIncomeChange(index, 'frequency', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="one-time">One-time</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                        <SelectItem value="yearly">Yearly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Select
                                                        value={income.month.toString()}
                                                        onValueChange={(v) => handleIncomeChange(index, 'month', Number(v))}
                                                    >
                                                        <SelectTrigger className="w-[110px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {MONTHS.map((m, i) => (
                                                                <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {(income.frequency === 'one-time' || income.frequency === 'monthly') && (
                                                        <Input
                                                            type="number"
                                                            className="w-[80px]"
                                                            value={income.year}
                                                            onChange={(e) => handleIncomeChange(index, 'year', Number(e.target.value))}
                                                            placeholder="Year"
                                                        />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={income.amount}
                                                    onChange={(e) => handleIncomeChange(index, 'amount', Number(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveIncome(index)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Button variant="outline" size="sm" onClick={handleAddIncome}>
                                <Plus className="mr-2 h-4 w-4" /> Add Income
                            </Button>
                        </div>

                        <hr className="my-6 border-t" />

                        <div className="space-y-4">
                            <Label className="text-base font-semibold">2. Extra Income Strategy</Label>
                            <p className="text-xs text-muted-foreground">How much of your Extra Income should go to debt?</p>

                            <div className="space-y-2">
                                <Label>Allocation Method</Label>
                                <Select
                                    value={extraAllocType}
                                    onValueChange={(v: any) => setExtraAllocType(v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full">Use 100% of Extra Income (Agile)</SelectItem>
                                        <SelectItem value="percent">Percentage of Extra Income</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount per Extra Income</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {extraAllocType === 'percent' && (
                                <div className="space-y-2">
                                    <Label>Percentage (%)</Label>
                                    <Input
                                        type="number"
                                        min="0" max="100"
                                        value={extraAllocValue}
                                        onChange={(e) => handlePercentageChange(setExtraAllocValue, Number(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">Enter 0-100%. The rest will be kept as savings.</p>
                                </div>
                            )}

                            {extraAllocType === 'fixed' && (
                                <div className="space-y-2">
                                    <Label>Fixed Amount ({currency})</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={extraAllocValue}
                                        onChange={(e) => setExtraAllocValue(Number(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">Fixed amount to pay extra from the bonus.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Monthly Repayment Strategy</CardTitle>
                        <CardDescription>
                            How much of your regular "Free Cash Flow" (from Salary) should go towards debt?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Allocation Method</Label>
                            <Select
                                value={allocationType}
                                onValueChange={(v: any) => setAllocationType(v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full">Use 100% of Free Cash (Recommended)</SelectItem>
                                    <SelectItem value="percent">Percentage of Free Cash</SelectItem>
                                    <SelectItem value="fixed">Fixed Monthly Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {allocationType === 'percent' && (
                            <div className="space-y-2">
                                <Label>Percentage (%)</Label>
                                <Input
                                    type="number"
                                    min="0" max="100"
                                    value={allocationValue}
                                    onChange={(e) => handlePercentageChange(setAllocationValue, Number(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">The rest will be saved.</p>
                            </div>
                        )}

                        {allocationType === 'fixed' && (
                            <div className="space-y-2">
                                <Label>Fixed Amount ({currency})</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={allocationValue}
                                    onChange={(e) => setAllocationValue(Number(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Max amount to pay extra per month.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} size="lg">Apply All Scenarios</Button>
            </div>
        </div>
    );
}
