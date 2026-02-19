"use client";

import { useAllTransactions, useDebts, deleteTransaction } from "@/hooks/use-debts";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Transaction } from "@/lib/db";
import { TransactionDialog } from "@/components/debts/TransactionDialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function PaymentsPage() {
    const transactions = useAllTransactions();
    const debts = useDebts();
    const { formatMoney } = useCurrency();
    const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);

    // Create a map of debtId to debtName for easy lookup
    const debtMap = new Map(debts?.map(d => [d.id, d.name]));

    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const handleEdit = (t: Transaction) => {
        setEditingTransaction(t);
        setIsEditOpen(true);
    };

    const handleDelete = (id: number) => {
        setTransactionToDelete(id);
    };

    const confirmDelete = async () => {
        if (transactionToDelete) {
            try {
                await deleteTransaction(transactionToDelete);
                setTransactionToDelete(null);
                toast.success("Transaction deleted");
            } catch (error) {
                toast.error("Failed to delete transaction");
            }
        }
    };

    return (
        <div className="space-y-6">
            <TransactionDialog
                transaction={editingTransaction}
                debtName={editingTransaction ? (debtMap.get(editingTransaction.debtId) || "Unknown") : ""}
                open={isEditOpen}
                onOpenChange={(open) => {
                    setIsEditOpen(open);
                    if (!open) setEditingTransaction(undefined);
                }}
            />

            <Dialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Transaction?</DialogTitle>
                        <DialogDescription>
                            This will remove the payment record and <strong>add the amount back</strong> to the debt balance.
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTransactionToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Payment History</h2>
                    <p className="text-muted-foreground">A record of all your debt payments.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Transactions
                    </CardTitle>
                    <CardDescription>
                        All recorded payments and adjustments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Note</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No payments recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedTransactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>{format(new Date(t.date), "MMM d, yyyy")}</TableCell>
                                        <TableCell className="font-medium">
                                            {debtMap.get(t.debtId) || "Unknown Account"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={t.type === 'payment' ? 'default' : 'secondary'} className="capitalize">
                                                {t.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                            {t.note || "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatMoney(t.amount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id!)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
