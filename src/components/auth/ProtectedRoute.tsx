"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via effect
    }

    return <>{children}</>;
}
