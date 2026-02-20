"use client";

import { useMemo } from "react";

import { useDebts } from "@/hooks/use-debts";
import { useBudget } from "@/hooks/use-budget";
import { useLanguage } from "@/contexts/LanguageContext";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { DebtChart } from "@/components/dashboard/DebtChart";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Calendar } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const debts = useDebts();
  const budget = useBudget();
  const { t } = useLanguage();

  // Calculate totals
  // Calculate totals
  const { totalDebt, activeDebts, closedDebts } = useMemo(() => {
    if (!debts) return { totalDebt: 0, activeDebts: 0, closedDebts: 0 };
    return {
      totalDebt: debts.reduce((sum, d) => sum + d.balance, 0),
      activeDebts: debts.filter(d => d.status === 'active').length,
      closedDebts: debts.filter(d => d.status === 'closed').length
    };
  }, [debts]);

  // Budget calculations would go here
  // For MVP, we might show 0 if no budget yet

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("Overview")}</h2>
          <p className="text-muted-foreground">{t("Welcome back! Here's your financial health at a glance.")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/payments">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              {t("Payment History")}
            </Button>
          </Link>
          <Link href="/plan">
            <Button size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              {t("View Plan")}
            </Button>
          </Link>
        </div>
      </div>

      <SummaryCards debts={debts} budget={budget} />

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-2 lg:col-span-4 max-w-full overflow-hidden">
          <DebtChart debts={debts} />
        </div>
        <div className="md:col-span-2 lg:col-span-3 max-w-full overflow-hidden">
          <UpcomingPayments />
        </div>
      </div>
    </div>
  );
}
