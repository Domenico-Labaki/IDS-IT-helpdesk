"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";

import { getCategories, getPriorities, getStatuses, getTicketById, updateTicket } from "@/lib/api/tickets";
import type { Category, Priority, Role, Status, Ticket } from "@/types";
import { decodeToken, getToken } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? getToken() : undefined;
  const decoded = token ? decodeToken(token) : null;
  const role = decoded?.role as Role | undefined;
  const currentUserId = decoded?.userId;

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

  useEffect(() => {
    let mounted = true;

    Promise.all([getTicketById(id), getCategories(), getPriorities(), getStatuses()])
      .then(([ticketData, cats, prios, stats]) => {
        if (!mounted) return;

        const isAuthorized =
          role === "Admin" ||
          role === "Agent" ||
          (role === "Employee" && ticketData.createdBy === currentUserId && ticketData.statusName === "Open");

        if (!isAuthorized) {
          router.replace(`/tickets/${id}`);
          return;
        }

        setTicket(ticketData);
        setCategories(cats);
        setPriorities(prios);
        setStatuses(stats);

        form.reset({
          title: ticketData.title,
          description: ticketData.description,
          categoryId: String(ticketData.categoryId),
          priorityId: String(ticketData.priorityId),
          statusId: String(ticketData.statusId),
          assignedTo: ticketData.assignedTo ?? "",
        });
      })
      .catch(() => {
        if (mounted) setError("Unable to load ticket data.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, role, currentUserId, router, form]);

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
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Ticket</h1>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 rounded-xl bg-zinc-100" />
              <div className="h-32 rounded-xl bg-zinc-100" />
              <div className="h-10 rounded-xl bg-zinc-100" />
              <div className="h-10 rounded-xl bg-zinc-100" />
              <div className="h-10 rounded-xl bg-zinc-100" />
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
                      <select
                        id="categoryId"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        {...field}
                      >
                        <option value="">Select a category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
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
                      <select
                        id="priorityId"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        {...field}
                      >
                        <option value="">Select a priority</option>
                        {priorities.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
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
                          <select
                            id="statusId"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            {...field}
                          >
                            <option value="">Select a status</option>
                            {statuses.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="assignedTo">Assigned To (User ID)</Label>
                          <Input id="assignedTo" placeholder="UUID of the user to assign" {...field} />
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
