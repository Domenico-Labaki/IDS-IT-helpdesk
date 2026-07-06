"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";

import { createTicket, getCategories, getPriorities } from "@/lib/api/tickets";
import type { Category, Priority, Role } from "@/types";
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
    <div className="space-y-6">
      <Button variant="ghost" className="mb-2" onClick={() => router.push("/tickets")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tickets
      </Button>

      <div className="max-w-3xl">
        <PageHeader title="Create New Ticket" description="Submit a new support request" />

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-400 to-zinc-600 dark:from-zinc-500 dark:to-zinc-700" />
          <CardHeader>
            <CardTitle>Ticket Information</CardTitle>
            <CardDescription>Please provide details about your issue</CardDescription>
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

                  <div className="grid grid-cols-2 gap-4">
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
                                  <SelectTrigger id="category">
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
                                title="Suggest category with AI"
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
                                  <SelectTrigger id="priority">
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
                                title="Suggest priority with AI"
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

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Tips for better support:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Be specific about the problem you're experiencing</li>
                      <li>Include error messages or screenshots if applicable</li>
                      <li>Mention what you've already tried to resolve the issue</li>
                      <li>Provide your system or application version if relevant</li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      <Send className="mr-2 h-4 w-4" />
                      {form.formState.isSubmitting ? "Submitting..." : "Submit Ticket"}
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

        <Card className="mt-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-400 to-zinc-600 dark:from-zinc-500 dark:to-zinc-700" />
          <CardHeader>
            <CardTitle>Need Immediate Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              For urgent issues that need immediate attention, please contact our support team directly:
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Phone:</strong> 1-800-SUPPORT</p>
              <p><strong>Email:</strong> support@company.com</p>
              <p><strong>Hours:</strong> Monday-Friday, 9:00 AM - 6:00 PM EST</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
