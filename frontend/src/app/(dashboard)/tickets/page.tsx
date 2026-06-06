"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getCategories, getStatuses, getTickets } from "@/lib/api/tickets";
import { deleteTicket } from "@/lib/api/tickets";
import type { Category, Role, Status, Ticket } from "@/types";
import { decodeToken, getToken } from "@/lib/auth";
import { priorityStyles, statusStyles } from "@/lib/ticket-styles";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-32 rounded bg-zinc-200" />
      <div className="flex gap-2">
        <div className="h-10 w-44 rounded-xl bg-zinc-100" />
        <div className="h-10 w-44 rounded-xl bg-zinc-100" />
      </div>
      <div className="space-y-3">
        <div className="h-12 rounded-xl bg-zinc-100" />
        <div className="h-12 rounded-xl bg-zinc-100" />
        <div className="h-12 rounded-xl bg-zinc-100" />
        <div className="h-12 rounded-xl bg-zinc-100" />
        <div className="h-12 rounded-xl bg-zinc-100" />
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const token = typeof window !== "undefined" ? getToken() : undefined;
  const decoded = token ? decodeToken(token) : null;
  const role = decoded?.role as Role | undefined;
  const currentUserId = decoded?.userId;

  useEffect(() => {
    let mounted = true;

    Promise.all([getTickets(), getCategories(), getStatuses()])
      .then(([ticketsData, categoriesData, statusesData]) => {
        if (!mounted) return;
        setTickets(ticketsData);
        setCategories(categoriesData);
        setStatuses(statusesData);
      })
      .catch(() => {
        if (mounted) setError("Unable to load tickets.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        if (statusFilter && ticket.statusId !== Number(statusFilter)) return false;
        if (categoryFilter && ticket.categoryId !== Number(categoryFilter)) return false;
        return true;
      }),
    [tickets, statusFilter, categoryFilter]
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;

    setDeletingId(id);
    try {
      await deleteTicket(id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
      toast.success("Ticket deleted.");
    } catch {
      toast.error("Unable to delete ticket.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          {(role === "Admin" || role === "Employee") && (
            <Button onClick={() => router.push("/tickets/new")}>Create Ticket</Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : (
            <>
              <div className="mb-4 flex gap-4">
                <select
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {filteredTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {tickets.length === 0
                    ? "No tickets found."
                    : "No tickets match the selected filters."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-muted-foreground border-b text-xs uppercase">
                      <tr>
                        <th className="px-3 py-3 font-medium">Reference</th>
                        <th className="px-3 py-3 font-medium">Title</th>
                        <th className="px-3 py-3 font-medium">Category</th>
                        <th className="px-3 py-3 font-medium">Priority</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-3 py-3 font-medium">Assigned To</th>
                        <th className="px-3 py-3 font-medium">Created</th>
                        <th className="px-3 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b last:border-b-0 hover:bg-zinc-50">
                          <td className="px-3 py-3 font-mono text-xs">{ticket.referenceNumber}</td>
                          <td className="px-3 py-3 font-medium">{ticket.title}</td>
                          <td className="px-3 py-3">{ticket.categoryName}</td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                priorityStyles[ticket.priorityName] ?? "bg-zinc-100 text-zinc-700"
                              }`}
                            >
                              {ticket.priorityName}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                statusStyles[ticket.statusName] ?? "bg-zinc-100 text-zinc-700"
                              }`}
                            >
                              {ticket.statusName}
                            </span>
                          </td>
                          <td className="px-3 py-3">{ticket.assignedToName ?? "\u2014"}</td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => router.push(`/tickets/${ticket.id}`)}
                              >
                                View
                              </Button>
                              {(role === "Admin" || role === "Agent" ||
                                (ticket.createdBy === currentUserId &&
                                  ticket.statusName === "Open")) && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => router.push(`/tickets/${ticket.id}/edit`)}
                                >
                                  Edit
                                </Button>
                              )}
                              {role === "Admin" && (
                                <Button
                                  variant="destructive"
                                  size="xs"
                                  disabled={deletingId === ticket.id}
                                  onClick={() => handleDelete(ticket.id)}
                                >
                                  {deletingId === ticket.id ? "..." : "Delete"}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
