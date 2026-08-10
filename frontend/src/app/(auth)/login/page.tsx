"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login, login2FA } from "@/lib/api/auth";
import { saveToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket, Shield } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const twoFactorSchema = z.object({
  code: z.string().length(6, "Enter a 6-digit code"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type TwoFactorFormValues = z.infer<typeof twoFactorSchema>;

export default function LoginPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const twoFactorForm = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  });

  const onSubmitLogin = async (data: LoginFormValues) => {
    setApiError(null);
    try {
      const response = await login(data);
      if (response.requiresTwoFactor && response.twoFactorToken) {
        setRequiresTwoFactor(true);
        setTwoFactorToken(response.twoFactorToken);
        return;
      }
      saveToken(response.token);
      window.location.assign("/dashboard");
    } catch {
      setApiError("Invalid email or password");
    }
  };

  const onSubmitTwoFactor = async (data: TwoFactorFormValues) => {
    setApiError(null);
    if (!twoFactorToken) return;
    try {
      const response = await login2FA(twoFactorToken, data.code);
      saveToken(response.token);
      window.location.assign("/dashboard");
    } catch {
      setApiError("Invalid verification code");
    }
  };

  const handleBackToLogin = () => {
    setRequiresTwoFactor(false);
    setTwoFactorToken(null);
    setApiError(null);
    twoFactorForm.reset();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-gradient-2 to-gradient-1 p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gradient-3/30 via-transparent to-transparent pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-b from-primary to-primary/80 shadow-lg shadow-black/10 flex items-center justify-center mb-4">
            {requiresTwoFactor ? (
              <Shield className="h-10 w-10 text-primary-foreground" />
            ) : (
              <Ticket className="h-10 w-10 text-primary-foreground" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">IT Help Desk</h1>
          <p className="text-muted-foreground mt-2">Ticket Management System</p>
        </div>

        <Card className="shadow-xl shadow-black/5 dark:shadow-black/20">
          <CardHeader>
            <CardTitle className="text-xl">
              {requiresTwoFactor ? "Two-Factor Authentication" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {requiresTwoFactor
                ? "Enter the 6-digit code from your authenticator app"
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requiresTwoFactor ? (
              <Form {...twoFactorForm}>
                <form className="space-y-4" onSubmit={twoFactorForm.handleSubmit(onSubmitTwoFactor)}>
                  <FormField
                    control={twoFactorForm.control}
                    name="code"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="2fa-code">Authentication Code</Label>
                        <Input
                          id="2fa-code"
                          placeholder="000000"
                          maxLength={6}
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          className="text-center text-2xl tracking-widest h-14"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        />
                        <FormMessage />
                      </div>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={twoFactorForm.formState.isSubmitting}>
                    {twoFactorForm.formState.isSubmitting ? "Verifying..." : "Verify"}
                  </Button>
                  {apiError ? <p className="text-sm font-medium text-destructive">{apiError}</p> : null}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      Back to login
                    </button>
                  </div>
                </form>
              </Form>
            ) : (
              <Form {...loginForm}>
                <form className="space-y-4" onSubmit={loginForm.handleSubmit(onSubmitLogin)}>
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input id="login-email" type="email" placeholder="name@company.com" autoComplete="email" {...field} />
                        <FormMessage />
                      </div>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input id="login-password" type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                        <FormMessage />
                      </div>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? "Logging in..." : "Login"}
                  </Button>
                  {apiError ? <p className="text-sm font-medium text-destructive">{apiError}</p> : null}
                  <div className="text-center">
                    <Link href="/forgot-password" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                      Forgot password?
                    </Link>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
