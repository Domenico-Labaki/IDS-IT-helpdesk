"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { deleteTicket, getTicketById } from "@/lib/api/tickets";
import type { Role, Ticket } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { statusStyles, priorityStyles } from "@/lib/ticket-styles";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, AlertCircle, User, Clock, Tag } from "lucide-react";
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

  const getStatusBadge = (statusName: string) => {
    const classes = statusStyles[statusName] ?? "bg-zinc-100 text-zinc-700";
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
        {statusName}
      </span>
    );
  };

  const getPriorityBadge = (priorityName: string) => {
    const classes = priorityStyles[priorityName] ?? "bg-zinc-100 text-zinc-700";
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
        {priorityName}
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!loading && !ticket && !error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Ticket Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The ticket you're looking for doesn't exist.
              </p>
              <Button asChild>
                <Link href="/tickets">Back to Tickets</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push("/tickets")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tickets
      </Button>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <p className="text-sm font-medium text-destructive">{error}</p>
      ) : ticket ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {ticket.referenceNumber}
                      </span>
                      {getStatusBadge(ticket.statusName)}
                      {getPriorityBadge(ticket.priorityName)}
                    </div>
                    <CardTitle className="text-2xl mb-2">{ticket.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {ticket.createdByName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        {ticket.categoryName}
                      </div>
                    </div>
                  </div>
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
                <CardDescription>0 comments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Comments are not yet available through the API.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <div>{getStatusBadge(ticket.statusName)}</div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <Label>Priority</Label>
                  <div>{getPriorityBadge(ticket.priorityName)}</div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <Label>Assigned To</Label>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {ticket.assignedToName ? getInitials(ticket.assignedToName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {ticket.assignedToName || "Unassigned"}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <Label>Category</Label>
                  <p className="text-sm">{ticket.categoryName}</p>
                </div>

                <Separator />

                <div className="space-y-1">
                  <Label>Created</Label>
                  <p className="text-sm">
                    {new Date(ticket.createdAt).toLocaleDateString()} at{" "}
                    {new Date(ticket.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <Separator />

                <div className="space-y-1">
                  <Label>Last Updated</Label>
                  <p className="text-sm">
                    {ticket.updatedAt
                      ? `${new Date(ticket.updatedAt).toLocaleDateString()} at ${new Date(ticket.updatedAt).toLocaleTimeString()}`
                      : "\u2014"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                  Assign to Me
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  Escalate Ticket
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive" disabled>
                  Close Ticket
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
