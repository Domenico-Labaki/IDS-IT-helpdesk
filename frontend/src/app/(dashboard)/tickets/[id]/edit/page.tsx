"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";

import { getCategories, getPriorities, getTicketById, updateTicket } from "@/lib/api/tickets";
import type { Category, Priority, Ticket } from "@/types";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { handleAiError, suggestCategory, suggestPriority } from "@/lib/api/ai";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Max 200 characters"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  priorityId: z.string().min(1, "Priority is required"),
});

type FormValues = z.infer<typeof schema>;

export default function EditTicketPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [suggestingCat, setSuggestingCat] = useState(false);
  const [suggestingPri, setSuggestingPri] = useState(false);

  const { role, currentUserId, isLoading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      priorityId: "",
    },
  });

  const watchedTitle = useWatch({ control: form.control, name: "title" });
  const hasTitle = !!watchedTitle?.trim();

  useEffect(() => {
    if (isLoading) return;

    let mounted = true;

    const load = async () => {
      try {
        const ticketData = await getTicketById(id);
        if (!mounted) return;

        const isAuthorized =
          role === "Admin" ||
          role === "Agent" ||
          ((role === "Employee" || role === "Manager") &&
            ticketData.createdBy === currentUserId &&
            (role === "Manager" || ticketData.statusName === "Open"));

        if (!isAuthorized) {
          router.replace(`/tickets/${id}`);
          return;
        }

        const [cats, prios] = await Promise.all([
          getCategories(),
          getPriorities(),
        ]);
        if (!mounted) return;

        setTicket(ticketData);
        setCategories(cats);
        setPriorities(prios);

        form.reset({
          title: ticketData.title,
          description: ticketData.description,
          categoryId: String(ticketData.categoryId),
          priorityId: String(ticketData.priorityId),
        });
      } catch {
        if (mounted) setError("Unable to load ticket data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [id, role, currentUserId, router, form, isLoading]);

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
      await updateTicket(id, {
        title: data.title,
        description: data.description,
        categoryId: Number(data.categoryId),
        priorityId: Number(data.priorityId),
      });
      toast.success("Ticket updated successfully.");
      router.push(`/tickets/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const message =
          error.response.data && typeof error.response.data === "object" && "message" in error.response.data
            ? String(error.response.data.message)
            : "Unable to update ticket.";
        setSubmitError(message);
      } else {
        setSubmitError("Unable to update ticket.");
      }
    }
  };

  return (
    <div className="workspace-page">
      <PageHeader title="Edit ticket" description="Refine the request definition while keeping its workflow history intact." />
      <Card className="mx-auto w-full max-w-4xl overflow-hidden">
        <CardHeader>
          <p className="section-label">Ticket revision</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Request information</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : !ticket ? (
            <p className="text-sm text-muted-foreground">Ticket not found.</p>
          ) : (
            <Form {...form}>
              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" maxLength={200} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        className="flex min-h-36 w-full resize-y rounded-[10px] border border-input bg-background px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="categoryId">Category</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="categoryId" className="w-full">
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
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priorityId"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="priorityId">Priority</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="priorityId" className="w-full">
                              <SelectValue placeholder="Select a priority" />
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
                    </FormItem>
                  )}
                />
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/tickets/${id}`)}
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
    </div>
  );
}
