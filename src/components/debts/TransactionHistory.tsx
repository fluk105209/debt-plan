import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useTransactions, deleteTransaction } from "@/hooks/use-debts";
import { Debt } from "@/lib/db";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionHistoryProps {
    debt: Debt | undefined;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const MotionTableRow = motion(TableRow);

export function TransactionHistory({ debt, open, onOpenChange }: TransactionHistoryProps) {
    const transactions = useTransactions(debt?.id);
    const { currency, formatMoney } = useCurrency();
    const { t } = useLanguage();

    const handleDelete = async (id: number, amount: number) => {
        try {
            await deleteTransaction(id);
            toast.success(`Transaction of ${formatMoney(amount)} deleted and balance reverted.`);
        } catch (error) {
            console.error("Failed to delete transaction:", error);
            toast.error("Failed to delete transaction");
        }
    };

    if (!debt) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-lg mx-auto sm:w-full sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{t("Transaction History")}</DialogTitle>
                    <DialogDescription>
                        {t("History for")} <span className="font-semibold">{debt.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[400px] overflow-y-auto overflow-x-auto relative">
                    <Table className="min-w-[400px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("Date")}</TableHead>
                                <TableHead>{t("Note")}</TableHead>
                                <TableHead className="text-right">{t("Amount")} ({currency})</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            {t("No transactions found.")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((transaction, index) => (
                                        <MotionTableRow
                                            key={transaction.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                        >
                                            <TableCell className="text-sm">
                                                {format(transaction.date, "dd MMM yyyy")}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {transaction.note || "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatMoney(transaction.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t("Delete Transaction?")}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t("This will permanently delete this record and")} <strong>{t("add")} {formatMoney(transaction.amount)} {t("back")}</strong> {t("to your debt balance.")}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-red-600 hover:bg-red-700"
                                                                onClick={() => transaction.id && handleDelete(transaction.id, transaction.amount)}
                                                            >
                                                                {t("Delete & Revert")}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </MotionTableRow>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
