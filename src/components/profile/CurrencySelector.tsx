"use client";

import { useCurrency, Currency } from "@/contexts/CurrencyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function CurrencySelector() {
    const { currency, setCurrency } = useCurrency();

    return (
        <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(val: Currency) => setCurrency(val)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="THB">Thai Baht (฿)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                    <SelectItem value="JPY">Japanese Yen (¥)</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
                Select your preferred currency for display.
            </p>
        </div>
    );
}
