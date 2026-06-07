"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { deleteTicket, getTicketById } from "@/lib/api/tickets";
import type { Role, Ticket } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { statusStyles, priorityStyles } from "@/lib/ticket-styles";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><div className="h-4 w-24 rounded bg-zinc-200" /><div className="h-5 w-40 rounded bg-zinc-100" /></div>
        <div className="space-y-2"><div className="h-4 w-12 rounded bg-zinc-200" /><div className="h-5 w-60 rounded bg-zinc-100" /></div>
      </div>
      <div className="space-y-2"><div className="h-4 w-20 rounded bg-zinc-200" /><div className="h-20 rounded-xl bg-zinc-100" /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2"><div className="h-4 w-16 rounded bg-zinc-200" /><div className="h-5 w-32 rounded bg-zinc-100" /></div>
        <div className="space-y-2"><div className="h-4 w-14 rounded bg-zinc-200" /><div className="h-5 w-28 rounded bg-zinc-100" /></div>
        <div className="space-y-2"><div className="h-4 w-12 rounded bg-zinc-200" /><div className="h-5 w-24 rounded bg-zinc-100" /></div>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { role, currentUserId } = useAuth();

  useEffect(() => {
    let mounted = true;

    getTicketById(id)
      .then((data) => {
        if (mounted) setTicket(data);
      })
      .catch(() => {
        if (mounted) setError("Unable to load ticket.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;

    setDeleting(true);
    try {
      await deleteTicket(id);
      toast.success("Ticket deleted.");
      router.push("/tickets");
    } catch {
      toast.error("Unable to delete ticket.");
      setDeleting(false);
    }
  };

  const canEdit =
    role === "Admin" ||
    role === "Agent" ||
    (ticket !== null && ticket.createdBy === currentUserId && ticket.statusName === "Open");

  const canDelete = role === "Admin";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Ticket Details</h1>
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => router.push(`/tickets/${id}/edit`)}>
                Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
                {deleting ? "..." : "Delete"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : !ticket ? (
            <p className="text-sm text-muted-foreground">Ticket not found.</p>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Reference Number</Label>
                  <p className="text-sm font-mono">{ticket.referenceNumber}</p>
                </div>
                <div className="space-y-1">
                  <Label>Title</Label>
                  <p className="text-sm font-medium">{ticket.title}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Description</Label>
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <p className="text-sm">{ticket.categoryName}</p>
                </div>
                <div className="space-y-1">
                  <Label>Priority</Label>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      priorityStyles[ticket.priorityName] ?? "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {ticket.priorityName}
                  </span>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      statusStyles[ticket.statusName] ?? "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {ticket.statusName}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Assigned To</Label>
                  <p className="text-sm">{ticket.assignedToName ?? "\u2014"}</p>
                </div>
                <div className="space-y-1">
                  <Label>Created By</Label>
                  <p className="text-sm">{ticket.createdByName}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label>Created At</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Resolved At</Label>
                  <p className="text-sm text-muted-foreground">
                    {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : "\u2014"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Closed At</Label>
                  <p className="text-sm text-muted-foreground">
                    {ticket.closedAt ? new Date(ticket.closedAt).toLocaleString() : "\u2014"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
