"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { forgotPassword } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({ email: z.string().email() });

type ForgotPasswordValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = async ({ email }: ForgotPasswordValues) => {
    try {
      await forgotPassword({ email });
    } catch {
      // Always show the same response to avoid revealing whether the email exists.
    } finally {
      setSuccessMessage("If that email is registered, you'll receive a reset link shortly.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
          <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
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
              <div className="space-y-3 pt-2">
                <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
                {successMessage ? <p className="text-sm text-muted-foreground">{successMessage}</p> : null}
                <Link className="block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" href="/login">
                  Back to login
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}