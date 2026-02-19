"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
// Note: ShadCN Sidebar component might need installation or we build custom.
// For now, I'll build a custom one if ShadCN sidebar isn't installed.
// Actually, let's assume I need to build a simple custom one first to avoid complex install steps if not needed.
// But wait, the previous plan said "Design Aesthetics: ... premium". Sidebar component is premium.
// I will try to use a simple custom implementation first in AppSidebar.
// This file is the Layout wrapper.

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-background">
                <AppSidebar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
