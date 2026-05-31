"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { resetPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[a-z]/, "Must contain lowercase")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? null;
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!token) router.replace("/forgot-password");
  }, [router, token]);

  const onSubmit = async ({ newPassword }: ResetPasswordValues) => {
    if (!token) return;
    setApiError(null);
    try {
      await resetPassword({ token, newPassword });
      setSuccessMessage("Password reset successfully.");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const message = error.response.data && typeof error.response.data === "object" && "message" in error.response.data
          ? String(error.response.data.message)
          : "Unable to reset password.";
        setApiError(message);
      }
    }
  };

  if (!token) return null;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        </CardHeader>
        <CardContent>
          {successMessage ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{successMessage}</p>
              <Link className="inline-flex text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" href="/login">
                Back to login
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="newPassword">New password</Label>
                      <Input id="newPassword" type="password" autoComplete="new-password" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <Input id="confirmPassword" type="password" autoComplete="new-password" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-3 pt-2">
                  <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Resetting..." : "Reset password"}
                  </Button>
                  {apiError ? <p className="text-sm text-destructive">{apiError}</p> : null}
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
