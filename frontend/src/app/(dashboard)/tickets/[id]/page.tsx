"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { assignTicket, deleteTicket, getTicketById, unassignTicket, updateTicketStatus, getComments, addComment, deleteComment, getStatusHistory, getAssignmentHistory, getTicketActivity } from "@/lib/api/tickets";
import { getUsers } from "@/lib/api/users";
import { getAttachments, deleteAttachment, getDownloadUrl, uploadAttachment } from "@/lib/api/attachments";
import type { ActivityLogEntry, AssignmentHistoryEntry, Role, StatusHistoryEntry, Ticket, User, Comment } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { statusStyles, priorityStyles, statusIdMap, allowedTransitions } from "@/lib/ticket-styles";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertCircle, User as UserIcon, Clock, Tag, Trash2, Paperclip, Download, Upload } from "lucide-react";
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [agents, setAgents] = useState<User[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState<number | "">("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [newCommentInternal, setNewCommentInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistoryEntry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    getUsers()
      .then((users) => setAgents(users.filter((u) => u.role === "Agent")))
      .catch(() => toast.error("Unable to load agents."));
  }, []);

  const fetchComments = useCallback(() => {
    return getComments(id).then(setComments).catch(() => toast.error("Unable to load comments."));
  }, [id]);

  useEffect(() => {
    getComments(id)
      .then(setComments)
      .catch(() => toast.error("Unable to load comments."))
      .finally(() => setCommentsLoading(false));
  }, [id, fetchComments]);

  const showHistory = role === "Admin" || role === "Agent" || role === "Manager";

  useEffect(() => {
    if (!showHistory) return;

    setHistoryLoading(true);
    Promise.all([
      getStatusHistory(id),
      getAssignmentHistory(id),
      getTicketActivity(id),
    ])
      .then(([sh, ah, al]) => {
        setStatusHistory(sh);
        setAssignmentHistory(ah);
        setActivityLogs(al);
      })
      .catch(() => toast.error("Unable to load history."))
      .finally(() => setHistoryLoading(false));
  }, [id, showHistory]);

  const { data: attachments, isLoading: attachmentsLoading } = useQuery({
    queryKey: ["attachments", id],
    queryFn: () => getAttachments(id),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", id] });
      toast.success("File uploaded.");
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message
          : "Unable to upload file.";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(id, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", id] });
      toast.success("Attachment deleted.");
    },
    onError: () => toast.error("Unable to delete attachment."),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    e.target.value = "";
  };

  const handleDeleteAttachment = (attachmentId: string, fileName: string) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return;
    deleteMutation.mutate(attachmentId);
  };

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

  const handleAddComment = async () => {
    if (!newCommentBody.trim()) return;
    setSubmittingComment(true);
    try {
      await addComment(id, { body: newCommentBody, isInternal: newCommentInternal });
      setNewCommentBody("");
      setNewCommentInternal(false);
      await fetchComments();
      toast.success("Comment added.");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message
          : "Unable to add comment.";
      toast.error(msg);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await deleteComment(id, commentId);
      await fetchComments();
      toast.success("Comment deleted.");
    } catch {
      toast.error("Unable to delete comment.");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId) return;
    setAssigning(true);
    try {
      await assignTicket(id, selectedAgentId);
      const updated = await getTicketById(id);
      setTicket(updated);
      setSelectedAgentId("");
      toast.success("Ticket assigned.");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message
          : "Unable to assign ticket.";
      toast.error(msg);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    setAssigning(true);
    try {
      await unassignTicket(id);
      const updated = await getTicketById(id);
      setTicket(updated);
      toast.success("Ticket unassigned.");
    } catch {
      toast.error("Unable to unassign ticket.");
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatusId) return;
    setUpdatingStatus(true);
    try {
      await updateTicketStatus(id, selectedStatusId, statusNotes || undefined);
      const updated = await getTicketById(id);
      setTicket(updated);
      setSelectedStatusId("");
      setStatusNotes("");
      toast.success("Status updated.");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message
          : "Unable to update status.";
      toast.error(msg);
    } finally {
      setUpdatingStatus(false);
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
                        <UserIcon className="h-4 w-4" />
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
                <CardDescription>{comments.length} comment{comments.length !== 1 ? "s" : ""}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {commentsLoading ? (
                  <div className="h-24 w-full rounded-xl bg-zinc-100 animate-pulse" />
                ) : comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No comments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`rounded-xl border p-4 ${comment.isInternal ? "bg-amber-50 border-amber-200" : ""}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                            {comment.isInternal && (
                              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100 text-xs">
                                Internal Note
                              </Badge>
                            )}
                          </div>
                          {(comment.authorId === currentUserId || role === "Admin") && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deletingCommentId === comment.id}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <Textarea
                    value={newCommentBody}
                    onChange={(e) => setNewCommentBody(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    {(role === "Admin" || role === "Agent") && (
                      <div className="flex items-center gap-2">
                        <Switch
                          id="internal-note"
                          checked={newCommentInternal}
                          onCheckedChange={setNewCommentInternal}
                        />
                        <Label htmlFor="internal-note" className="text-sm cursor-pointer">
                          Internal Note
                        </Label>
                      </div>
                    )}
                    <Button
                      onClick={handleAddComment}
                      disabled={!newCommentBody.trim() || submittingComment}
                      className="ml-auto"
                    >
                      {submittingComment ? "..." : "Add Comment"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments Section */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments ({attachments?.length ?? 0})</CardTitle>
                <CardDescription>Uploaded files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {attachmentsLoading ? (
                  <div className="h-16 rounded-xl bg-zinc-100 animate-pulse" />
                ) : attachments && attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.fileSizeBytes)} &middot; {attachment.uploaderName} &middot;{" "}
                              {new Date(attachment.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon-xs" asChild>
                            <a href={getDownloadUrl(id, attachment.id)} target="_blank" rel="noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          {(attachment.uploadedBy === currentUserId || role === "Admin") && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDeleteAttachment(attachment.id, attachment.fileName)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No attachments.</p>
                )}

                <Separator />

                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpeg,.jpg,.png,.gif,.pdf,.txt,.doc,.docx"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                  <span className="text-xs text-muted-foreground">Max 10MB</span>
                </div>
              </CardContent>
            </Card>

            {/* History Section */}
            {showHistory && (
              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="space-y-3">
                      <div className="h-6 w-full rounded-xl bg-zinc-100 animate-pulse" />
                      <div className="h-6 w-3/4 rounded-xl bg-zinc-100 animate-pulse" />
                      <div className="h-6 w-1/2 rounded-xl bg-zinc-100 animate-pulse" />
                    </div>
                  ) : (
                    <Tabs defaultValue="status">
                      <TabsList className="w-full">
                        <TabsTrigger value="status" className="flex-1">Status</TabsTrigger>
                        <TabsTrigger value="assignment" className="flex-1">Assignment</TabsTrigger>
                        <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                      </TabsList>

                      <TabsContent value="status" className="space-y-0 mt-4">
                        {statusHistory.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No status changes recorded.</p>
                        ) : (
                          <div className="relative">
                            {statusHistory.map((entry, index) => (
                              <div key={entry.id} className="flex gap-4 pb-6 last:pb-0">
                                <div className="flex flex-col items-center">
                                  <div className="h-3 w-3 rounded-full bg-zinc-300 ring-4 ring-white mt-1.5" />
                                  {index < statusHistory.length - 1 && (
                                    <div className="w-px flex-1 bg-zinc-200 mt-1" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {getStatusBadge(entry.oldStatusName)}
                                    <span className="text-muted-foreground">&rarr;</span>
                                    {getStatusBadge(entry.newStatusName)}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    by {entry.changedByName} &middot; {new Date(entry.changedAt).toLocaleString()}
                                  </p>
                                  {entry.notes && (
                                    <p className="text-sm text-muted-foreground italic mt-0.5">{entry.notes}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="assignment" className="space-y-3 mt-4">
                        {assignmentHistory.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No assignment changes recorded.</p>
                        ) : (
                          <div className="space-y-3">
                            {assignmentHistory.map((entry) => (
                              <div key={entry.id} className="flex items-center gap-3 text-sm">
                                <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>
                                  <span className="font-medium">{entry.assignedByName}</span>
                                  {" assigned to "}
                                  <span className="font-medium">{entry.assignedToName ?? "Unassigned"}</span>
                                </span>
                                <span className="text-muted-foreground ml-auto whitespace-nowrap">
                                  {new Date(entry.assignedAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="activity" className="space-y-3 mt-4">
                        {activityLogs.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No activity recorded.</p>
                        ) : (
                          <div className="space-y-3">
                            {activityLogs.map((entry) => (
                              <div key={entry.id} className="flex items-center gap-3 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>
                                  <span className="font-medium">{entry.userName}</span>
                                  {" "}
                                  {entry.action}
                                  {entry.entityType ? ` ${entry.entityType}` : ""}
                                </span>
                                <span className="text-muted-foreground ml-auto whitespace-nowrap">
                                  {new Date(entry.performedAt).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            )}
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

            {(role === "Admin" || role === "Agent") && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label>Current Assignee</Label>
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

                    <div className="space-y-2">
                      <Label>Select Agent</Label>
                      <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an agent..." />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAssign}
                        disabled={!selectedAgentId || assigning}
                      >
                        {assigning ? "..." : "Assign"}
                      </Button>
                      {role === "Admin" && ticket.assignedTo && (
                        <Button
                          variant="outline"
                          onClick={handleUnassign}
                          disabled={assigning}
                        >
                          Unassign
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label>Current Status</Label>
                      <div>{getStatusBadge(ticket.statusName)}</div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>New Status</Label>
                      <Select
                        value={selectedStatusId.toString()}
                        onValueChange={(v) => setSelectedStatusId(v ? Number(v) : "")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select next status..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(allowedTransitions[ticket.statusName] ?? []).map((statusId) => (
                            <SelectItem key={statusId} value={statusId.toString()}>
                              {statusIdMap[statusId]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        placeholder="Reason for status change..."
                        rows={2}
                      />
                    </div>

                    <Button
                      onClick={handleStatusUpdate}
                      disabled={!selectedStatusId || updatingStatus}
                    >
                      {updatingStatus ? "..." : "Update Status"}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
