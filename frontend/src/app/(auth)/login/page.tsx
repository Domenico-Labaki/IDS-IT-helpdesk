"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login } from "@/lib/api/auth";
import { saveToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    try {
      const response = await login(data);
      saveToken(response.token);
      window.location.assign("/dashboard");
    } catch {
      setApiError("Invalid email or password");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">IT Help Desk</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" autoComplete="email" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" autoComplete="current-password" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3 pt-2">
                <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
                {apiError ? <p className="text-sm font-medium text-destructive">{apiError}</p> : null}
                <Link className="block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" href="/forgot-password">
                  Forgot your password?
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
