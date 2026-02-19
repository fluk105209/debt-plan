"use client";

import { CreditCard } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Visual Side */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 text-white p-12 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-8">
                        <CreditCard className="h-8 w-8 text-blue-400" />
                        <span className="text-2xl font-bold">Debt Freedom</span>
                    </div>
                    <h1 className="text-4xl font-bold max-w-md leading-tight">
                        Master your money.<br />
                        Crush your debt.<br />
                        <span className="text-blue-400">Live your life.</span>
                    </h1>
                </div>

                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-20%] w-[800px] h-[800px] rounded-full bg-blue-600 blur-[120px]" />
                    <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-purple-600 blur-[100px]" />
                </div>

                <div className="relative z-10">
                    <p className="text-zinc-400 text-sm">
                        &copy; 2026 Debt Freedom. Local First, Privacy Focused.
                    </p>
                </div>
            </div>

            {/* Form Side */}
            <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
                <div className="w-full max-w-sm space-y-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
