"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency, Currency } from "@/contexts/CurrencyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AppearanceSettings() {
    const { language, setLanguage, t } = useLanguage();
    const { currency, setCurrency } = useCurrency();

    const [tempLanguage, setTempLanguage] = useState<'en' | 'th'>(language);
    const [tempCurrency, setTempCurrency] = useState<Currency>(currency);
    const [loading, setLoading] = useState(false);

    // Sync local state when context changes (e.g. initial load)
    useEffect(() => {
        setTempLanguage(language);
    }, [language]);

    useEffect(() => {
        setTempCurrency(currency);
    }, [currency]);

    const handleApply = async () => {
        setLoading(true);
        try {
            // Simulate a brief delay for better UX (optional, but feels more "saved")
            await new Promise(resolve => setTimeout(resolve, 500));

            setLanguage(tempLanguage);
            setCurrency(tempCurrency);

            toast.success(t("Preferences updated successfully"));
        } catch (error) {
            toast.error(t("Failed to update preferences"));
        } finally {
            setLoading(false);
        }
    };

    const hasChanges = tempLanguage !== language || tempCurrency !== currency;

    return (
        <div className="space-y-6 max-w-md">
            <div className="space-y-2">
                <Label>{t("Application Language")}</Label>
                <Select value={tempLanguage} onValueChange={(val: 'en' | 'th') => setTempLanguage(val)}>
                    <SelectTrigger>
                        <SelectValue placeholder={t("Select Language")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">{t("English (English)")}</SelectItem>
                        {/* <SelectItem value="th">{t("Thai (ไทย)")}</SelectItem> */}
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                    {t("Select your preferred language for the interface.")}
                </p>
            </div>

            <div className="space-y-2">
                <Label>{t("Currency")}</Label>
                <Select value={tempCurrency} onValueChange={(val: Currency) => setTempCurrency(val)}>
                    <SelectTrigger>
                        <SelectValue placeholder={t("Select Currency")} />
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
                    {t("Select your preferred currency for display.")}
                </p>
            </div>

            <div className="pt-2">
                <Button onClick={handleApply} disabled={loading || !hasChanges}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("Apply Preferences")}
                </Button>
            </div>
        </div>
    );
}
