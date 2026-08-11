"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { resetPassword } from "@/lib/api/auth";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({ newPassword: z.string().min(8, "At least 8 characters").regex(/[A-Z]/, "Must contain uppercase").regex(/[a-z]/, "Must contain lowercase").regex(/[0-9]/, "Must contain a number").regex(/[^A-Za-z0-9]/, "Must contain a special character"), confirmPassword: z.string() }).refine((data) => data.newPassword === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
type Values = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? null;
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { newPassword: "", confirmPassword: "" } });
  useEffect(() => { if (!token) router.replace("/forgot-password"); }, [router, token]);
  const onSubmit = async ({ newPassword }: Values) => { if (!token) return; setApiError(null); try { await resetPassword({ token, newPassword }); setSuccess(true); } catch (error) { if (axios.isAxiosError(error) && error.response?.status === 400) { const data = error.response.data; setApiError(data && typeof data === "object" && "message" in data ? String(data.message) : "Unable to reset password."); } } };
  if (!token) return null;

  return (
    <AuthShell eyebrow="Secure recovery" title="Choose a new password." description="Use at least eight characters with uppercase, lowercase, number, and special character.">
      {success ? <div className="space-y-5"><div className="rounded-xl border border-primary/20 bg-primary/[0.055] p-4"><CheckCircle2 className="size-5 text-primary" /><p className="mt-3 text-sm">Your password has been reset successfully.</p></div><Button asChild className="w-full" size="lg"><Link href="/login">Return to sign in <ArrowRight /></Link></Button></div> : (
        <Form {...form}><form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}><FormField control={form.control} name="newPassword" render={({ field }) => <FormItem><Label htmlFor="newPassword">New password</Label><Input id="newPassword" type="password" autoComplete="new-password" {...field} /><FormMessage /></FormItem>} /><FormField control={form.control} name="confirmPassword" render={({ field }) => <FormItem><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" type="password" autoComplete="new-password" {...field} /><FormMessage /></FormItem>} />{apiError && <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">{apiError}</p>}<Button className="w-full" size="lg" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Resetting…" : <>Set new password <ArrowRight /></>}</Button></form></Form>
      )}
      {!success && <Link className="mt-5 flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground" href="/login"><ArrowLeft className="size-3.5" />Back to sign in</Link>}
    </AuthShell>
  );
}

export default function ResetPasswordPage() { return <Suspense fallback={null}><ResetPasswordForm /></Suspense>; }
