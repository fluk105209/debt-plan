"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, User, ShieldCheck } from "lucide-react";
import { seedDatabase } from "@/lib/seed-data";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppearanceSettings } from "@/components/profile/AppearanceSettings";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";

export default function SettingsPage() {
    const [isSeeding, setIsSeeding] = useState(false);
    const { user } = useAuth();

    const handleSeedData = async () => {
        if (!user) {
            toast.error("You must be logged in to generate data");
            return;
        }

        if (!confirm("This will clear all existing data for your account and replace it with mock data. Continue?")) {
            return;
        }

        setIsSeeding(true);
        try {
            await seedDatabase(user.id);
            toast.success("Mock data generated successfully! Please refresh.");
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate mock data");
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage application settings and data.</p>
            </div>

            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                <CardHeader>
                    <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Developer Zone
                    </CardTitle>
                    <CardDescription className="text-red-600/80 dark:text-red-400/80">
                        Tools for testing and development.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-background rounded-lg border">
                        <div>
                            <h4 className="font-semibold">Generate Mock Data</h4>
                            <p className="text-sm text-muted-foreground">
                                Populates the database with sample debts, budget, and history.
                                <br />
                                <span className="font-bold text-red-500">Warning: Clears existing data.</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={async () => {
                                    if (!user) {
                                        toast.error("You must be logged in to clear data");
                                        return;
                                    }
                                    if (!confirm("Are you sure you want to clear YOUR account data? This cannot be undone.")) return;
                                    try {
                                        const { clearDatabase } = await import("@/lib/seed-data");
                                        await clearDatabase(user.id);
                                        toast.success("Your data cleared successfully");
                                        window.location.reload();
                                    } catch (err) {
                                        toast.error("Failed to clear data");
                                    }
                                }}
                            >
                                Clear Data
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleSeedData}
                                disabled={isSeeding}
                            >
                                {isSeeding ? "Generating..." : "Generate Data"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>


            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Appearance & Language
                        </CardTitle>
                        <CardDescription>
                            Customize your experience.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <AppearanceSettings />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5" />
                            Security
                        </CardTitle>
                        <CardDescription>
                            Manage your password and security settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PasswordChangeForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
