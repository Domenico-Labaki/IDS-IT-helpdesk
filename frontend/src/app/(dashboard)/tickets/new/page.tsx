"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";

import { createTicket, getCategories, getPriorities } from "@/lib/api/tickets";
import type { Category, Priority } from "@/types";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { handleAiError, suggestCategory, suggestPriority } from "@/lib/api/ai";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Max 200 characters"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  priorityId: z.string().min(1, "Priority is required"),
});

type FormValues = z.infer<typeof schema>;

export default function CreateTicketPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [suggestingCat, setSuggestingCat] = useState(false);
  const [suggestingPri, setSuggestingPri] = useState(false);

  const { role, isLoading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", categoryId: "", priorityId: "" },
  });

  const watchedTitle = form.watch("title");
  const hasTitle = !!watchedTitle?.trim();

  useEffect(() => {
    if (isLoading) return;

    if (role !== "Admin" && role !== "Employee") {
      router.replace("/tickets");
      return;
    }

    let mounted = true;

    Promise.all([getCategories(), getPriorities()])
      .then(([cats, prios]) => {
        if (!mounted) return;
        setCategories(cats);
        setPriorities(prios);
      })
      .catch(() => {
        if (mounted) setLoadError("Unable to load form data.");
      })
      .finally(() => {
        if (mounted) setLoadingRefs(false);
      });

    return () => {
      mounted = false;
    };
  }, [role, router, isLoading]);

  const handleSuggestCategory = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description");
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in the title and description first.");
      return;
    }
    setSuggestingCat(true);
    try {
      const result = await suggestCategory(title, description);
      form.setValue("categoryId", String(result.categoryId));
      setCategories((prev) => {
        const exists = prev.some((c) => c.id === result.categoryId);
        if (!exists) {
          return [...prev, { id: result.categoryId, name: result.categoryName, description: result.reasoning }];
        }
        return prev;
      });
    } catch (err) {
      handleAiError(err, "AI suggestion unavailable right now.");
    } finally {
      setSuggestingCat(false);
    }
  };

  const handleSuggestPriority = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description");
    const categoryId = Number(form.getValues("categoryId"));
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in the title and description first.");
      return;
    }
    setSuggestingPri(true);
    try {
      const result = await suggestPriority(title, description, categoryId || 0);
      form.setValue("priorityId", String(result.priorityId));
      setPriorities((prev) => {
        const exists = prev.some((p) => p.id === result.priorityId);
        if (!exists) {
          return [...prev, { id: result.priorityId, name: result.priorityName, level: 0 }];
        }
        return prev;
      });
    } catch (err) {
      handleAiError(err, "AI priority suggestion unavailable right now.");
    } finally {
      setSuggestingPri(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    try {
      await createTicket({
        title: data.title,
        description: data.description,
        categoryId: Number(data.categoryId),
        priorityId: Number(data.priorityId),
      });
      toast.success("Ticket created successfully.");
      router.push("/tickets");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const message =
          error.response.data && typeof error.response.data === "object" && "message" in error.response.data
            ? String(error.response.data.message)
            : "Unable to create ticket.";
        setSubmitError(message);
      } else {
        setSubmitError("Unable to create ticket.");
      }
    }
  };

  if (!isLoading && role !== "Admin" && role !== "Employee") return null;

  return (
    <div className="workspace-page">
      <Button variant="ghost" className="w-fit" onClick={() => router.push("/tickets")}>
        <ArrowLeft />
        Back to tickets
      </Button>

      <PageHeader title="Create ticket" description="Give the support team a clear signal. HELIX can help classify it before submission." />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,780px)_minmax(280px,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader>
            <p className="section-label">Request definition</p>
            <CardTitle className="mt-1">Ticket information</CardTitle>
            <CardDescription>Describe the issue, its context, and its urgency.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRefs ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : loadError ? (
              <p className="text-sm font-medium text-destructive">{loadError}</p>
            ) : (
              <Form {...form}>
                <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <Label htmlFor="title">
                            Title <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="title"
                            placeholder="Brief description of the issue"
                            maxLength={200}
                            {...field}
                          />
                          <p className="text-xs text-muted-foreground">
                            Provide a clear and concise title
                          </p>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <Label htmlFor="description">
                            Description <span className="text-destructive">*</span>
                          </Label>
                          <Textarea
                            id="description"
                            placeholder="Provide detailed information about the issue..."
                            rows={8}
                            {...field}
                          />
                          <p className="text-xs text-muted-foreground">
                            Include steps to reproduce, error messages, and any relevant details
                          </p>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-2">
                            <Label htmlFor="category">
                              Category <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger id="category" className="w-full">
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((c) => (
                                      <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleSuggestCategory}
                                disabled={suggestingCat || !hasTitle}
                                title="Ask HELIX to suggest a category"
                              >
                                <Sparkles className={`h-4 w-4 ${suggestingCat ? "animate-pulse" : ""}`} />
                              </Button>
                            </div>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priorityId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-2">
                            <Label htmlFor="priority">
                              Priority <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger id="priority" className="w-full">
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {priorities.map((p) => (
                                      <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleSuggestPriority}
                                disabled={suggestingPri || !hasTitle}
                                title="Ask HELIX to suggest a priority"
                              >
                                <Sparkles className={`h-4 w-4 ${suggestingPri ? "animate-pulse" : ""}`} />
                              </Button>
                            </div>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground -mt-3">
                    Select the urgency level of your request
                  </p>

                  <div className="rounded-xl border border-primary/20 bg-primary/[0.045] p-4">
                    <div className="mb-2 flex items-center gap-2"><Sparkles className="size-4 text-primary" /><h4 className="text-sm font-semibold">HELIX-ready request</h4></div>
                    <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-muted-foreground">
                      <li>Be specific about the problem you&apos;re experiencing</li>
                      <li>Include error messages or screenshots if applicable</li>
                      <li>Mention what you&apos;ve already tried to resolve the issue</li>
                      <li>Provide your system or application version if relevant</li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      <Send />
                      {form.formState.isSubmitting ? "Submitting..." : "Submit ticket"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/tickets")}
                      disabled={form.formState.isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                  {submitError ? <p className="text-sm font-medium text-destructive">{submitError}</p> : null}
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <p className="section-label">Escalation path</p>
            <CardTitle className="mt-1">Need immediate help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              For urgent issues that need immediate attention, please contact our support team directly:
            </p>
            <div className="divide-y divide-border text-xs">
              <p className="flex justify-between py-2"><span className="text-muted-foreground">Phone</span><strong>1-800-SUPPORT</strong></p>
              <p className="flex justify-between py-2"><span className="text-muted-foreground">Email</span><strong>support@company.com</strong></p>
              <p className="flex justify-between py-2"><span className="text-muted-foreground">Hours</span><strong>Mon–Fri, 9–6 EST</strong></p>
            </div>
          </CardContent>
        </Card>
        <div className="helix-gradient relative overflow-hidden rounded-xl p-5 text-white"><div className="signal-grid absolute inset-0 opacity-25" /><div className="relative"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/65">HELIX assist</p><p className="mt-2 text-sm font-semibold">Use the sparkle controls to classify your request from its title and description.</p></div></div>
        </div>
      </div>
    </div>
  );
}
