"use client";

import { Debt } from "@/lib/db";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, History, CreditCard, PlusCircle } from "lucide-react";
import { deleteDebt } from "@/hooks/use-debts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";

import { useState } from "react";
import { DebtFormDialog } from "./DebtFormDialog";
import { PaymentDialog } from "./PaymentDialog";
import { TransactionHistory } from "./TransactionHistory";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { motion, AnimatePresence } from "framer-motion";

interface DebtListProps {
    debts: Debt[] | undefined;
}

const MotionTableRow = motion(TableRow);

export function DebtList({ debts }: DebtListProps) {
    const { formatMoney } = useCurrency();
    const { t } = useLanguage();
    const [editingDebt, setEditingDebt] = useState<Debt | undefined>(undefined);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const [payingDebt, setPayingDebt] = useState<Debt | undefined>(undefined);
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [historyDebt, setHistoryDebt] = useState<Debt | undefined>(undefined);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const [debtToDelete, setDebtToDelete] = useState<number | null>(null);

    const handleDelete = (id: number) => {
        setDebtToDelete(id);
    }

    const handlePay = (debt: Debt) => {
        setPayingDebt(debt);
        setIsPayOpen(true);
    }

    const handleHistory = (debt: Debt) => {
        setHistoryDebt(debt);
        setIsHistoryOpen(true);
    }

    const confirmDelete = async () => {
        if (debtToDelete) {
            await deleteDebt(debtToDelete);
            setDebtToDelete(null);
        }
    }

    const handleEdit = (debt: Debt) => {
        setEditingDebt(debt);
        setIsEditOpen(true);
    }

    if (!debts || debts.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center h-64 border rounded-lg bg-muted/10 border-dashed border-2">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <div className="relative">
                        <MoreHorizontal className="h-8 w-8 text-primary opacity-50 absolute -top-2 -left-2" />
                        <CreditCard className="h-10 w-10 text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold">{t("No accounts yet")}</h3>
                <p className="text-muted-foreground text-sm max-w-sm text-center mt-1">
                    {t("Add your first credit card or loan to start your debt-free journey.")}
                </p>
                <div className="mt-6">
                    <DebtFormDialog
                        onOpenChange={setIsEditOpen}
                        trigger={
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {t("Add First Account")}
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <DebtFormDialog
                debtToEdit={editingDebt}
                open={isEditOpen}
                onOpenChange={(open) => {
                    setIsEditOpen(open);
                    if (!open) setEditingDebt(undefined);
                }}
                showTrigger={false}
            />

            <PaymentDialog
                debt={payingDebt}
                open={isPayOpen}
                onOpenChange={(open: boolean) => {
                    setIsPayOpen(open);
                    if (!open) setPayingDebt(undefined);
                }}
            />

            <TransactionHistory
                debt={historyDebt}
                open={isHistoryOpen}
                onOpenChange={(open) => {
                    setIsHistoryOpen(open);
                    if (!open) setHistoryDebt(undefined);
                }}
            />

            <Dialog open={!!debtToDelete} onOpenChange={(open) => !open && setDebtToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("Are you sure?")}</DialogTitle>
                        <DialogDescription>
                            {t("This action cannot be undone. This will permanently delete the debt account.")}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDebtToDelete(null)}>{t("Cancel")}</Button>
                        <Button variant="destructive" onClick={confirmDelete}>{t("Delete")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("Account Name")}</TableHead>
                            <TableHead>{t("Type")}</TableHead>
                            <TableHead className="text-right">{t("Balance")}</TableHead>
                            <TableHead className="text-right">{t("Interest")}</TableHead>
                            <TableHead className="text-right">{t("Min Payment")}</TableHead>
                            <TableHead className="text-right">{t("Due Day")}</TableHead>
                            <TableHead className="text-center">{t("Status")}</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {debts.map((debt, index) => (
                                <MotionTableRow
                                    key={debt.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <TableCell className="font-medium">{debt.name}</TableCell>
                                    <TableCell className="capitalize">{debt.type.replace(/_/g, " ")}</TableCell>
                                    <TableCell className="text-right">{formatMoney(debt.balance)}</TableCell>
                                    <TableCell className="text-right">
                                        {debt.promoRate !== undefined && debt.promoEndDate && new Date() <= new Date(debt.promoEndDate) ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-green-600 font-bold">{debt.promoRate}%</span>
                                                <span className="text-xs line-through text-muted-foreground">{debt.interestRate}%</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Until {new Date(debt.promoEndDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ) : (
                                            <span>{debt.interestRate}%</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {debt.minPaymentType === 'percent'
                                            ? (
                                                <div className="flex flex-col items-end">
                                                    <span>{debt.minPaymentValue}%</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({formatMoney(Math.round((debt.balance * debt.minPaymentValue) / 100))})
                                                    </span>
                                                </div>
                                            )
                                            : `${formatMoney(debt.minPaymentValue)}`}
                                    </TableCell>
                                    <TableCell className="text-right">{debt.dueDay}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={debt.status === 'active' ? 'default' : 'secondary'}>
                                            {debt.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                                title="Record Payment"
                                                onClick={() => handlePay(debt)}
                                            >
                                                <span className="font-bold">{formatMoney(0).replace(/\d|,|\./g, '')}</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                title="View History"
                                                onClick={() => handleHistory(debt)}
                                            >
                                                <History className="h-4 w-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEdit(debt)}>
                                                        <Edit className="mr-2 h-4 w-4" /> {t("Edit")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        onSelect={() => {
                                                            // use state based dialog instead of window.confirm
                                                            if (debt.id) handleDelete(debt.id);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> {t("Delete")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </MotionTableRow>
                            ))}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div >
        </>
    );
}
