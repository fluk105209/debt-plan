"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDebts, useAllTransactions } from "@/hooks/use-debts";
import { useBudget } from "@/hooks/use-budget";
import { usePaymentPlan } from "@/hooks/use-plan";
import { generatePlan } from "@/lib/planning-engine";
import { Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { format } from "date-fns";

export default function ImportExportPage() {
    const debts = useDebts();
    const budget = useBudget();
    const planConfig = usePaymentPlan();
    const transactions = useAllTransactions();

    const handleExport = () => {
        if (!debts || !budget) {
            toast.error("Data not loaded yet.");
            return;
        }

        const wb = XLSX.utils.book_new();
        const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");

        // --- 1. Summary Sheet ---
        const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
        const plan = generatePlan(debts, budget, planConfig);
        const payoffDate = plan.length > 0 ? plan[plan.length - 1].date : new Date();

        const summaryData = [
            { Item: "Export Date", Value: format(new Date(), "PPpp") },
            { Item: "Total Debt", Value: totalDebt },
            { Item: "Target Payoff Date", Value: format(payoffDate, "MMM yyyy") },
            { Item: "Strategy", Value: planConfig?.strategy || "Snowball" },
            {
                Item: "Monthly Free Cash", Value: (budget.salary + budget.otherIncome) - (
                    budget.tax +
                    budget.sso +
                    budget.pvd +
                    (budget.expenses?.rent || 0) +
                    (budget.expenses?.food || 0) +
                    (budget.expenses?.transport || 0) +
                    (budget.expenses?.others || 0) +
                    (budget.expenses?.custom?.reduce((sum, item) => sum + item.amount, 0) || 0)
                )
            }
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        // Set column widths
        wsSummary['!cols'] = [{ wch: 20 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");


        // --- 2. Debts Sheet ---
        const debtsData = debts.map(d => ({
            ID: d.id,
            Name: d.name,
            Type: d.type,
            "Balance (THB)": d.balance,
            "Interest Rate (%)": d.interestRate,
            "Min Payment": d.minPaymentType === 'percent' ? `${d.minPaymentValue}%` : d.minPaymentValue,
            "Due Day": d.dueDay,
            Status: d.status,
            Notes: d.notes || ""
        }));
        const wsDebts = XLSX.utils.json_to_sheet(debtsData);
        wsDebts['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsDebts, "Debts");


        // --- 3. Budget Sheet ---
        const budgetData = [
            { Category: "Income", Item: "Salary", Amount: budget.salary },
            { Category: "Income", Item: "Other", Amount: budget.otherIncome },
            { Category: "Deduction", Item: "Tax", Amount: budget.tax },
            { Category: "Deduction", Item: "SSO", Amount: budget.sso },
            { Category: "Deduction", Item: "PVD", Amount: budget.pvd },
            { Category: "Expense", Item: "Rent", Amount: budget.expenses?.rent },
            { Category: "Expense", Item: "Food", Amount: budget.expenses?.food },
            { Category: "Expense", Item: "Transport", Amount: budget.expenses?.transport },
            { Category: "Expense", Item: "Other", Amount: budget.expenses?.others },
        ];
        const wsBudget = XLSX.utils.json_to_sheet(budgetData);
        wsBudget['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsBudget, "Budget");


        // --- 4. Payment Plan Sheet ---
        const planData = plan.map(p => ({
            Month: format(p.date, "MMM yyyy"),
            "Total Payment": p.totalPayment,
            "Principal Paid": p.debts.reduce((s, d) => s + (d.actualPayment - d.interest), 0),
            "Interest Paid": p.totalInterest,
            "Remaining Debt": p.debts.reduce((s, d) => s + d.endBalance, 0),
            "Remaining Cash": p.remainingCash
        }));
        const wsPlan = XLSX.utils.json_to_sheet(planData);
        wsPlan['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsPlan, "Payment Plan");


        // --- 5. Transaction History Sheet ---
        // Need to join with Debt Name using debts array
        const debtMap = new Map(debts.map(d => [d.id, d.name]));

        const historyData = transactions?.map(t => ({
            Date: format(new Date(t.date), "yyyy-MM-dd"),
            Account: debtMap.get(t.debtId) || "Unknown",
            Type: t.type,
            Amount: t.amount,
            Note: t.note || ""
        })) || []; // Handle case where transactions might be undefined initially

        // Sort by date new to old
        historyData.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

        const wsHistory = XLSX.utils.json_to_sheet(historyData);
        wsHistory['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, wsHistory, "History");


        // Save File
        XLSX.writeFile(wb, `DebtFreedom_Export_${timestamp}.xlsx`);
        toast.success("Exported successfully!");
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Import / Export</h2>
                <p className="text-muted-foreground">Manage your data locally.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Export Data
                    </CardTitle>
                    <CardDescription>
                        Download all your data as a multi-sheet Excel file.
                        <br />
                        Includes: Summary, Debts, Budget, Plan, and History.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleExport} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Export to Excel
                    </Button>
                </CardContent>
            </Card>

            <Card className="opacity-50">
                <CardHeader>
                    <CardTitle>Import Data (Coming Soon)</CardTitle>
                    <CardDescription>
                        Restore from a backup or import from a template.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button disabled className="w-full sm:w-auto" variant="outline">
                        Select File...
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
