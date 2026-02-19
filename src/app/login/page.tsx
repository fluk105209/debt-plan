"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginPage() {
    return (
        <AuthLayout>
            <LoginForm />
        </AuthLayout>
    );
}

function LoginForm() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Login State
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Sign Up State
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupUsername, setSignupUsername] = useState("");
    const { t } = useLanguage();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!supabase) {
            toast.error("Supabase client not initialized.");
            setLoading(false);
            return;
        }

        try {
            // 1. Look up email from username
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', loginUsername)
                .single();

            if (profileError || !profile) {
                toast.error(t("Username not found"));
                setLoading(false);
                return;
            }

            // 2. Sign in with the found email
            const { error } = await supabase.auth.signInWithPassword({
                email: profile.email,
                password: loginPassword,
            });

            if (error) {
                toast.error(error.message);
            } else {
                toast.success(t("Welcome back!"));
                router.push("/");
            }
        } catch (err) {
            console.error(err);
            toast.error(t("An error occurred during login"));
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!supabase) {
            toast.error("Supabase client not initialized.");
            setLoading(false);
            return;
        }

        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: signupEmail,
                password: signupPassword,
                options: {
                    data: {
                        username: signupUsername,
                    },
                },
            });

            if (authError) {
                toast.error(authError.message);
                setLoading(false);
                return;
            }

            if (authData.user) {
                // 2. Create Profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        username: signupUsername,
                        email: signupEmail,
                        updated_at: new Date().toISOString(),
                    });

                if (profileError) {
                    console.error("Error creating profile:", profileError);
                }

                toast.success(t("Account created! Please check your email."));
            }
        } catch (err) {
            console.error(err);
            toast.error(t("An error occurred during sign up"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">{t("Login")}</TabsTrigger>
                <TabsTrigger value="signup">{t("Sign Up")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("Login")}</CardTitle>
                        <CardDescription>
                            {t("Enter your email below to login to your account.")}
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">{t("Username")}</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="johndoe"
                                    required
                                    value={loginUsername}
                                    onChange={(e) => setLoginUsername(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">{t("Password")}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="mt-4">
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("Sign In")}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>

            <TabsContent value="signup">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("Sign Up")}</CardTitle>
                        <CardDescription>
                            {t("Create a new account to get started.")}
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignUp}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">{t("Username")}</Label>
                                <Input
                                    id="username"
                                    placeholder="johndoe"
                                    required
                                    value={signupUsername}
                                    onChange={(e) => setSignupUsername(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">{t("Email")}</Label>
                                <Input
                                    id="signup-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={signupEmail}
                                    onChange={(e) => setSignupEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">{t("Password")}</Label>
                                <Input
                                    id="signup-password"
                                    type="password"
                                    required
                                    value={signupPassword}
                                    onChange={(e) => setSignupPassword(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="mt-4">
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("Create Account")}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
        </Tabs >
    );
}
