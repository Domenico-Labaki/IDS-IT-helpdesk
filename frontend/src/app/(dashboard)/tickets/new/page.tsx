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
});

type FormValues = z.infer<typeof schema>;

export default function CreateTicketPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? getToken() : undefined;
  const decoded = token ? decodeToken(token) : null;
  const role = decoded?.role as Role | undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", categoryId: "", priorityId: "" },
  });

  useEffect(() => {
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
  }, [role, router]);

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

  if (role !== "Admin" && role !== "Employee") return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">Create Ticket</h1>
        </CardHeader>
        <CardContent>
          {loadingRefs ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 rounded-xl bg-zinc-100" />
              <div className="h-32 rounded-xl bg-zinc-100" />
              <div className="h-10 rounded-xl bg-zinc-100" />
              <div className="h-10 rounded-xl bg-zinc-100" />
            </div>
          ) : loadError ? (
            <p className="text-sm font-medium text-destructive">{loadError}</p>
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
                <div className="space-y-3 pt-2">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Creating..." : "Create Ticket"}
                  </Button>
                  {submitError ? <p className="text-sm font-medium text-destructive">{submitError}</p> : null}
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
