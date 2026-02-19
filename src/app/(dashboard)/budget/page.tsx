"use client";

import { IncomeForm } from "@/components/budget/IncomeForm";
import { ExpenseForm } from "@/components/budget/ExpenseForm";

import { useLanguage } from "@/contexts/LanguageContext";

export default function BudgetPage() {
    const { t } = useLanguage();
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{t("Monthly Budget")}</h2>
                <p className="text-muted-foreground">{t("Set your recurring income and fixed expenses.")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                <IncomeForm />
                <ExpenseForm />
            </div>
        </div>
    );
}
