"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CreditCard,
    Calendar,
    SlidersHorizontal,
    Settings,
    Menu,
    Wallet,
    FileSpreadsheet,
    History,
    LineChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function UserProfile() {
    const { user, signOut } = useAuth();

    if (!user) return null;

    const email = user.email || "User";
    const initial = email[0].toUpperCase();
    const username = user.user_metadata?.username || email.split('@')[0];

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
            <Avatar className="h-9 w-9 border-2 border-background">
                <AvatarFallback className="bg-primary text-primary-foreground">
                    {initial}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{username}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={signOut}
                title="Sign Out"
            >
                <LogOut className="h-4 w-4" />
            </Button>
        </div>
    );
}

const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Debts", href: "/debts", icon: CreditCard },
    { name: "Budget", href: "/budget", icon: Wallet },
    { name: "Monthly Plan", href: "/plan", icon: Calendar },
    { name: "Scenarios", href: "/scenarios", icon: SlidersHorizontal },
    { name: "Payment History", href: "/payments", icon: History },
    { name: "Burn Down", href: "/burndown", icon: LineChart },
    { name: "Import/Export", href: "/import-export", icon: FileSpreadsheet },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Mobile Trigger */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <SidebarContent pathname={pathname} setOpen={setOpen} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r bg-card/50 backdrop-blur-xl">
                <SidebarContent pathname={pathname} />
            </aside>
        </>
    );
}

function SidebarContent({ pathname, setOpen }: { pathname: string; setOpen?: (open: boolean) => void }) {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Debt Freedom
                </h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen?.(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                            <span className="font-medium">{t(item.name)}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t mt-auto space-y-4">
                <UserProfile />
                <div className="text-xs text-muted-foreground text-center">
                    v0.1.0 • Local First
                </div>
            </div>
        </div>
    );
}
