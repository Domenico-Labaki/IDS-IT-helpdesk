"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";

import { getCategories, getPriorities, getStatuses, getTicketById, updateTicket } from "@/lib/api/tickets";
import { getUsers } from "@/lib/api/users";
import type { Category, Priority, Role, Status, Ticket, User } from "@/types";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  statusId: z.string().min(1, "Status is required"),
  assignedTo: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditTicketPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
      statusId: "",
      assignedTo: "",
    },
  });

  const watchedTitle = form.watch("title");
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
          (role === "Employee" && ticketData.createdBy === currentUserId && ticketData.statusName === "Open");

        if (!isAuthorized) {
          router.replace(`/tickets/${id}`);
          return;
        }

        const [cats, prios, stats] = await Promise.all([
          getCategories(),
          getPriorities(),
          getStatuses(),
        ]);
        if (!mounted) return;

        let allUsers: User[] = [];
        if (role === "Admin" || role === "Agent") {
          allUsers = (await getUsers()).filter((u) => u.isActive && u.role === "Agent");
        }

        setTicket(ticketData);
        setCategories(cats);
        setPriorities(prios);
        setStatuses(stats);
        setUsers(allUsers);

        form.reset({
          title: ticketData.title,
          description: ticketData.description,
          categoryId: String(ticketData.categoryId),
          priorityId: String(ticketData.priorityId),
          statusId: String(ticketData.statusId),
          assignedTo: ticketData.assignedTo ?? "",
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
        statusId: Number(data.statusId),
        assignedTo: data.assignedTo?.trim() || null,
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

  const showAdminFields = role === "Admin" || role === "Agent";

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-400 to-zinc-600 dark:from-zinc-500 dark:to-zinc-700" />
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Ticket</h1>
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
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                        className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y"
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
                            <SelectTrigger id="categoryId">
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
                            <SelectTrigger id="priorityId">
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
                          title="Suggest priority with AI"
                        >
                          <Sparkles className={`h-4 w-4 ${suggestingPri ? "animate-pulse" : ""}`} />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {showAdminFields && (
                  <>
                    <FormField
                      control={form.control}
                      name="statusId"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="statusId">Status</Label>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="statusId">
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="assignedTo">Assigned To</Label>
                          <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v === "none" ? null : v)}>
                            <SelectTrigger id="assignedTo">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {users.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.fullName} ({u.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
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
