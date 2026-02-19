"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function LanguageSelector() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="space-y-2">
            <Label>Application Language</Label>
            <Select value={language} onValueChange={(val: 'en' | 'th') => setLanguage(val)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en">English (English)</SelectItem>
                    <SelectItem value="th">Thai (ไทย)</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
                Select your preferred language for the interface.
            </p>
        </div>
    );
}
