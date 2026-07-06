"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getCategories, getStatuses, getTickets, type TicketFilterParams } from "@/lib/api/tickets";
import { deleteTicket } from "@/lib/api/tickets";
import type { Category, Role, Status, Ticket, PagedResult } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { priorityStyles, statusStyles } from "@/lib/ticket-styles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarSrc } from "@/lib/avatar";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FilterChips } from "@/components/FilterChips";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ChevronLeft, ChevronRight, Filter, Plus, Search, Inbox } from "lucide-react";
import { toast } from "sonner";

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="flex gap-2">
        <div className="h-10 w-44 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-10 w-44 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const router = useRouter();
  const { role, currentUserId } = useAuth();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [data, setData] = useState<PagedResult<Ticket> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchData = useCallback(async (filters: TicketFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const [result, cats, sts] = await Promise.all([
        getTickets(filters),
        getCategories(),
        getStatuses(),
      ]);
      setData(result);
      setCategories(cats);
      setStatuses(sts);
    } catch {
      setError("Unable to load tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  useEffect(() => {
    const params: TicketFilterParams = { page, pageSize };
    if (searchQuery) params.searchText = searchQuery;
    if (statusFilter && statusFilter !== "all") params.statusId = Number(statusFilter);
    if (categoryFilter && categoryFilter !== "all") params.categoryId = Number(categoryFilter);
    fetchData(params);
  }, [page, searchQuery, statusFilter, categoryFilter, fetchData]);

  const totalPages = data ? Math.max(1, data.totalPages) : 1;

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await deleteTicket(id);
      toast.success("Ticket deleted.");
      fetchData({ page, pageSize, searchText: searchQuery || undefined, statusId: statusFilter && statusFilter !== "all" ? Number(statusFilter) : undefined, categoryId: categoryFilter && categoryFilter !== "all" ? Number(categoryFilter) : undefined });
    } catch {
      toast.error("Unable to delete ticket.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("");
    setCategoryFilter("");
    setPage(1);
  };

  const tickets = data?.items ?? [];

  const filterChips = [];
  if (searchQuery) filterChips.push({ label: `Search: "${searchQuery}"`, onRemove: () => { setSearchInput(""); setSearchQuery(""); setPage(1); } });
  if (statusFilter && statusFilter !== "all") {
    const name = statuses.find((s) => String(s.id) === statusFilter)?.name ?? statusFilter;
    filterChips.push({ label: `Status: ${name}`, onRemove: () => { setStatusFilter(""); setPage(1); } });
  }
  if (categoryFilter && categoryFilter !== "all") {
    const name = categories.find((c) => String(c.id) === categoryFilter)?.name ?? categoryFilter;
    filterChips.push({ label: `Category: ${name}`, onRemove: () => { setCategoryFilter(""); setPage(1); } });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tickets" description="Manage and track support tickets">
        {(role === "Admin" || role === "Employee") && (
          <Button asChild>
            <Link href="/tickets/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Link>
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter tickets by status, category, or search</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search tickets... (Ctrl+/)"
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>

              <FilterChips chips={filterChips} />

              {loading ? (
                <LoadingSkeleton />
              ) : tickets.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="h-12 w-12" />}
                  title="No tickets found"
                  description={searchQuery || statusFilter || categoryFilter ? "Try adjusting your filters." : "There are no tickets yet."}
                  action={
                    (role === "Admin" || role === "Employee") && (
                      <Button asChild>
                        <Link href="/tickets/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first ticket
                        </Link>
                      </Button>
                    )
                  }
                />
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-muted-foreground border-b text-xs uppercase">
                        <tr>
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
                        {tickets.map((ticket) => (
                          <tr key={ticket.id} className="border-b last:border-b-0 hover:bg-muted/50">
                            <td className="px-3 py-3 font-medium">
                              <Link href={`/tickets/${ticket.id}`} className="hover:underline">{ticket.title}</Link>
                            </td>
                            <td className="px-3 py-3">{ticket.categoryName}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityStyles[ticket.priorityName] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                                {ticket.priorityName}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[ticket.statusName] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                                {ticket.statusName}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {ticket.assignedToName ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={getAvatarSrc(ticket.assignedToAvatarUrl)} alt={ticket.assignedToName} />
                                    <AvatarFallback className="text-[10px]">{getInitials(ticket.assignedToName)}</AvatarFallback>
                                  </Avatar>
                                  <span>{ticket.assignedToName}</span>
                                </div>
                              ) : "\u2014"}
                            </td>
                            <td className="px-3 py-3 text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                            <td className="px-3 py-3">
                              <div className="flex gap-1">
                                <Button variant="outline" size="xs" onClick={() => router.push(`/tickets/${ticket.id}`)}>View</Button>
                                {(role === "Admin" || role === "Agent" || (ticket.createdBy === currentUserId && ticket.statusName === "Open")) && (
                                  <Button variant="outline" size="xs" onClick={() => router.push(`/tickets/${ticket.id}/edit`)}>Edit</Button>
                                )}
                                {role === "Admin" && (
                                  <Button variant="destructive" size="xs" disabled={deletingId === ticket.id} onClick={() => handleDelete(ticket.id)}>
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

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {tickets.map((ticket) => (
                      <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                        <Card className="relative overflow-hidden hover:bg-accent transition-colors">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            ticket.statusName === "Open" ? "bg-blue-400" :
                            ticket.statusName === "In Progress" ? "bg-yellow-400" :
                            ticket.statusName === "Resolved" ? "bg-green-400" :
                            ticket.statusName === "Closed" ? "bg-zinc-400" :
                            ticket.statusName === "Cancelled" ? "bg-red-400" : "bg-zinc-300"
                          }`} />
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyles[ticket.priorityName] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                                    {ticket.priorityName}
                                  </span>
                                </div>
                                <h3 className="font-semibold mb-1">{ticket.title}</h3>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[ticket.statusName] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                                {ticket.statusName}
                              </span>
                              <span className="text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {data ? `Page ${data.page} of ${totalPages} (${data.totalCount} total)` : ""}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                      </Button>
                      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(o) => { if (!o) setDeleteConfirmId(null); }}
        title="Delete Ticket"
        description="Are you sure you want to delete this ticket? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
