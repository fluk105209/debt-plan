"use client";

import { useDebts } from "@/hooks/use-debts";
import { DebtList } from "@/components/debts/DebtList";
import { DebtFormDialog } from "@/components/debts/DebtFormDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebtsPage() {
    const debts = useDebts();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Debt Accounts</h2>
                    <p className="text-muted-foreground">Manage all your credit cards, loans, and other debts.</p>
                </div>
                <DebtFormDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Accounts</CardTitle>
                    <CardDescription>
                        List of all accounts currently tracked.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DebtList debts={debts} />
                </CardContent>
            </Card>
        </div>
    );
}
