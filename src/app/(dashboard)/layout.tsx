"use client";

import { AppSidebar, MobileSidebar } from "@/components/layout/AppSidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-background overflow-hidden relative">
                {/* Desktop Sidebar */}
                <AppSidebar />

                {/* Mobile Sidebar (Sheet) */}
                <MobileSidebar open={mobileOpen} setOpen={setMobileOpen} />

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Mobile Header */}
                    <header className="md:hidden flex items-center h-14 px-4 border-b bg-background/95 backdrop-blur z-40 sticky top-0">
                        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="mr-2">
                            <Menu className="h-5 w-5" />
                        </Button>
                        <span className="font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Debt Freedom</span>
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
