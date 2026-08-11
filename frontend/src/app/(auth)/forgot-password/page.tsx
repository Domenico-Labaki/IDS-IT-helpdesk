"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { forgotPassword } from "@/lib/api/auth";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });
  const onSubmit = async ({ email }: Values) => { try { await forgotPassword({ email }); } catch { /* Keep account existence private. */ } finally { setSuccessMessage("If that email is registered, a reset link is on its way."); } };

  return (
    <AuthShell eyebrow="Account recovery" title="Reset your access." description="Enter your work email. We’ll send recovery instructions if it matches an account.">
      {successMessage ? <div className="rounded-xl border border-primary/20 bg-primary/[0.055] p-4"><CheckCircle2 className="size-5 text-primary" /><p className="mt-3 text-sm leading-6">{successMessage}</p></div> : (
        <Form {...form}><form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}><FormField control={form.control} name="email" render={({ field }) => <FormItem><Label htmlFor="email">Work email</Label><Input id="email" type="email" placeholder="name@company.com" autoComplete="email" {...field} /><FormMessage /></FormItem>} /><Button className="w-full" size="lg" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Sending…" : <>Send reset link <ArrowRight /></>}</Button></form></Form>
      )}
      <Link className="mt-5 flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground" href="/login"><ArrowLeft className="size-3.5" />Back to sign in</Link>
    </AuthShell>
  );
}
