"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { assignTicket, deleteTicket, getTicketById, unassignTicket, updateTicketStatus, getComments, addComment, deleteComment, getStatusHistory, getAssignmentHistory, getTicketActivity } from "@/lib/api/tickets";
import { getUsers } from "@/lib/api/users";
import { getAttachments, deleteAttachment, uploadAttachment } from "@/lib/api/attachments";
import { handleAiError, scanAttachment, suggestReply } from "@/lib/api/ai";
import type { ActivityLogEntry, AssignmentHistoryEntry, Role, StatusHistoryEntry, Ticket, User, Comment } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { statusStyles, priorityStyles, statusIdMap, allowedTransitions } from "@/lib/ticket-styles";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertCircle, User as UserIcon, Clock, Tag, Trash2, Paperclip, FileText, Download, Upload, Sparkles } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { getInitials, getAvatarSrc } from "@/lib/avatar";
import { formatAction } from "@/lib/format-activity";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-40" /></div>
        <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-5 w-60" /></div>
      </div>
      <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-20 w-full rounded-xl" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-5 w-32" /></div>
        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-28" /></div>
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
  const [suggestingReply, setSuggestingReply] = useState(false);
  const [scanningAttachments, setScanningAttachments] = useState<Set<string>>(new Set());
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [confirmDeleteTicket, setConfirmDeleteTicket] = useState(false);
  const [confirmDeleteAttachment, setConfirmDeleteAttachment] = useState<string | null>(null);
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
    if (role !== "Admin" && role !== "Agent") return;
    getUsers()
      .then((users) => setAgents(users.filter((u) => u.role === "Agent")))
      .catch(() => toast.error("Unable to load agents."));
  }, [role]);

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

  const fetchHistory = useCallback(() => {
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

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const [activeHistoryTab, setActiveHistoryTab] = useState("status");

  useEffect(() => {
    const saved = localStorage.getItem("historyTab");
    if (saved) setActiveHistoryTab(saved);
  }, []);

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
    setConfirmDeleteAttachment(attachmentId);
  };

  const handleDelete = () => {
    setConfirmDeleteTicket(true);
  };

  const executeDelete = async () => {
    setConfirmDeleteTicket(false);
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

  const handleSuggestReply = async () => {
    setSuggestingReply(true);
    try {
      const result = await suggestReply(id);
      setNewCommentBody(result.suggestedBody);
      toast.success("Reply suggested by AI.");
    } catch (err) {
      handleAiError(err, "AI reply suggestion unavailable right now.");
    } finally {
      setSuggestingReply(false);
    }
  };

  const handleScanAttachment = async (attachmentId: string) => {
    setScanningAttachments((prev) => new Set(prev).add(attachmentId));
    try {
      await scanAttachment(attachmentId);
      toast.success("Attachment scanned by AI.");
      queryClient.invalidateQueries({ queryKey: ["attachments", id] });
    } catch (err) {
      handleAiError(err, "AI scan unavailable right now.");
    } finally {
      setScanningAttachments((prev) => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
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
      fetchHistory();
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
      fetchHistory();
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
      fetchHistory();
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
    const classes = statusStyles[statusName] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
        {statusName}
      </span>
    );
  };

  const getPriorityBadge = (priorityName: string) => {
    const classes = priorityStyles[priorityName] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
        {priorityName}
      </span>
    );
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
      <div className="flex items-center justify-between mb-2">
        <Breadcrumbs items={[{ label: "Tickets", href: "/tickets" }, { label: ticket?.title ?? "Loading..." }]} />
        <Button variant="ghost" size="sm" onClick={() => router.push("/tickets")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

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
                      {getStatusBadge(ticket.statusName)}
                      {getPriorityBadge(ticket.priorityName)}
                    </div>
                    <CardTitle className="text-2xl mb-2">{ticket.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={getAvatarSrc(ticket.createdByAvatarUrl)} alt={ticket.createdByName} />
                          <AvatarFallback className="text-[10px]">{getInitials(ticket.createdByName)}</AvatarFallback>
                        </Avatar>
                        <span>{ticket.createdByName}</span>
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
                  <Skeleton className="h-24 w-full rounded-xl" />
                ) : comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No comments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`rounded-xl border p-4 ${comment.isInternal ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30" : ""}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={getAvatarSrc(comment.authorAvatarUrl)} alt={comment.authorName} />
                              <AvatarFallback className="text-[10px]">{getInitials(comment.authorName)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                            {comment.isInternal && (
                              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100 dark:text-amber-400 dark:border-amber-700 dark:bg-amber-950/30 text-xs">
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
                    <div className="flex items-center gap-2">
                      {(role === "Admin" || role === "Agent") && (
                        <>
                          <Switch
                            id="internal-note"
                            checked={newCommentInternal}
                            onCheckedChange={setNewCommentInternal}
                          />
                          <Label htmlFor="internal-note" className="text-sm cursor-pointer">
                            Internal Note
                          </Label>
                        </>
                      )}
                      {(role === "Admin" || role === "Agent" || role === "Manager") && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSuggestReply}
                          disabled={suggestingReply}
                        >
                          <Sparkles className={`mr-1.5 h-3.5 w-3.5 ${suggestingReply ? "animate-pulse" : ""}`} />
                          {suggestingReply ? "Thinking..." : "Suggest Reply"}
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={handleAddComment}
                      disabled={!newCommentBody.trim() || submittingComment}
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
                  <Skeleton className="h-16 w-full rounded-xl" />
                ) : attachments && attachments.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {attachments.map((attachment) => {
                      const isImage = attachment.mimeType.startsWith("image/");
                      const isPdf = attachment.mimeType === "application/pdf";
                      const isDocument = attachment.mimeType === "text/plain" || attachment.mimeType === "application/msword" || attachment.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                      const isScanning = scanningAttachments.has(attachment.id);
                      const hasSummary = !!attachment.aiSummary;
                      return (
                        <div key={attachment.id} className="flex flex-col gap-1">
                          <div className="group relative rounded-lg border overflow-hidden">
                            {isImage ? (
                              <div className="aspect-square bg-muted">
                                {attachment.previewUrl ? (
                                  <img
                                    src={attachment.previewUrl}
                                    alt={attachment.fileName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <FileText className="h-10 w-10 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                  <p className="text-xs text-white font-medium truncate">{attachment.fileName}</p>
                                  <p className="text-[10px] text-white/80">
                                    {formatFileSize(attachment.fileSizeBytes)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-square flex flex-col items-center justify-center bg-muted p-3">
                                {isPdf ? (
                                  <FileText className="h-8 w-8 text-destructive mb-2" />
                                ) : isDocument ? (
                                  <FileText className="h-8 w-8 text-blue-500 mb-2" />
                                ) : (
                                  <Paperclip className="h-8 w-8 text-muted-foreground mb-2" />
                                )}
                                <p className="text-xs font-medium truncate max-w-full text-center">{attachment.fileName}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatFileSize(attachment.fileSizeBytes)}
                                </p>
                              </div>
                            )}
                            <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isImage && !hasSummary && (
                                <Button
                                  variant="secondary"
                                  size="icon-xs"
                                  onClick={() => handleScanAttachment(attachment.id)}
                                  disabled={isScanning}
                                  className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
                                  title="Scan with AI"
                                >
                                  <Sparkles className={`h-3.5 w-3.5 ${isScanning ? "animate-pulse" : ""}`} />
                                </Button>
                              )}
                              <Button variant="secondary" size="icon-xs" asChild className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white">
                                <a href={attachment.downloadUrl} target="_blank" rel="noreferrer">
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                              {(attachment.uploadedBy === currentUserId || role === "Admin") && (
                                <Button
                                  variant="secondary"
                                  size="icon-xs"
                                  onClick={() => handleDeleteAttachment(attachment.id, attachment.fileName)}
                                  disabled={deleteMutation.isPending}
                                  className="h-7 w-7 bg-black/50 hover:bg-red-600 text-white"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {hasSummary && (
                            <div className="rounded-lg border bg-muted/50 p-2">
                              <p className="text-xs text-muted-foreground leading-relaxed">{attachment.aiSummary}</p>
                            </div>
                          )}
                          {isImage && !hasSummary && !isScanning && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleScanAttachment(attachment.id)}
                              className="text-xs h-7"
                            >
                              <Sparkles className="mr-1 h-3 w-3" />
                              Scan with AI
                            </Button>
                          )}
                          {isImage && isScanning && (
                            <div className="flex items-center gap-1.5 justify-center py-1">
                              <Sparkles className="h-3 w-3 animate-pulse text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Scanning...</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                      <Skeleton className="h-6 w-full rounded-xl" />
                      <Skeleton className="h-6 w-3/4 rounded-xl" />
                      <Skeleton className="h-6 w-1/2 rounded-xl" />
                    </div>
                  ) : (
                    <Tabs value={activeHistoryTab} onValueChange={(v) => { setActiveHistoryTab(v); localStorage.setItem("historyTab", v); }}>
                      <TabsList className="w-full">
                        <TabsTrigger value="status" className="flex-1">Status</TabsTrigger>
                        <TabsTrigger value="assignment" className="flex-1">Assignment</TabsTrigger>
                        <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                      </TabsList>

                      <TabsContent value="status" className="space-y-0 mt-4">
                        {statusHistory.length === 0 ? (
                          <EmptyState title="No status changes" description="No status changes have been recorded for this ticket." />
                        ) : (
                          <div className="relative">
                            {statusHistory.map((entry, index) => {
                              const dotColor =
                                entry.newStatusName === "Open" ? "bg-blue-500" :
                                entry.newStatusName === "In Progress" ? "bg-yellow-500" :
                                entry.newStatusName === "Resolved" ? "bg-green-500" :
                                entry.newStatusName === "Closed" ? "bg-zinc-500" :
                                entry.newStatusName === "Cancelled" ? "bg-red-500" : "bg-zinc-400";
                              return (
                                <div key={entry.id} className="flex gap-4 pb-6 last:pb-0">
                                  <div className="flex flex-col items-center">
                                    <div className={`h-3 w-3 rounded-full ${dotColor} ring-4 ring-white dark:ring-background mt-1.5 shadow-sm`} />
                                    {index < statusHistory.length - 1 && (
                                      <div className="w-px flex-1 bg-gradient-to-b from-zinc-300 to-transparent dark:from-zinc-700 mt-1" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {getStatusBadge(entry.oldStatusName)}
                                      <span className="text-muted-foreground">&rarr;</span>
                                      {getStatusBadge(entry.newStatusName)}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={getAvatarSrc(entry.changedByAvatarUrl)} alt={entry.changedByName} />
                                        <AvatarFallback className="text-[8px]">{getInitials(entry.changedByName)}</AvatarFallback>
                                      </Avatar>
                                      <p className="text-sm text-muted-foreground">
                                        {entry.changedByName} &middot; {new Date(entry.changedAt).toLocaleString()}
                                      </p>
                                    </div>
                                    {entry.notes && (
                                      <p className="text-sm text-muted-foreground italic mt-0.5 border-l-2 border-muted pl-3">{entry.notes}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="assignment" className="space-y-3 mt-4">
                        {assignmentHistory.length === 0 ? (
                          <EmptyState title="No assignment changes" description="No assignment changes have been recorded for this ticket." />
                        ) : (
                          <div className="space-y-3">
                            {assignmentHistory.map((entry) => (
                              <div key={entry.id} className="flex items-center gap-3 text-sm">
                                <Avatar className="h-6 w-6 shrink-0">
                                  <AvatarImage src={getAvatarSrc(entry.assignedByAvatarUrl)} alt={entry.assignedByName} />
                                  <AvatarFallback className="text-[10px]">{getInitials(entry.assignedByName)}</AvatarFallback>
                                </Avatar>
                                <span>
                                  <span className="font-medium">{entry.assignedByName}</span>
                                  {" "}
                                  {entry.assignedToName
                                    ? <>
                                        assigned to
                                        <div className="inline-flex items-center gap-1 ml-1">
                                          <Avatar className="h-5 w-5 inline-flex">
                                            <AvatarImage src={getAvatarSrc(entry.assignedToAvatarUrl)} alt={entry.assignedToName} />
                                            <AvatarFallback className="text-[8px]">{getInitials(entry.assignedToName)}</AvatarFallback>
                                          </Avatar>
                                          <span className="font-medium">{entry.assignedToName}</span>
                                        </div>
                                      </>
                                    : entry.id === "00000000-0000-0000-0000-000000000000"
                                      ? "created this ticket (unassigned)"
                                      : "unassigned this ticket"}
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
                          <EmptyState title="No activity" description="No activity has been recorded for this ticket." />
                        ) : (
                          <div className="space-y-3">
                            {activityLogs.map((entry) => (
                              <div key={entry.id} className="flex items-center gap-3 text-sm">
                                <Avatar className="h-6 w-6 shrink-0">
                                  <AvatarImage src={getAvatarSrc(entry.userAvatarUrl)} alt={entry.userName} />
                                  <AvatarFallback className="text-[10px]">{getInitials(entry.userName)}</AvatarFallback>
                                </Avatar>
                                <span>
                                  <span className="font-medium">{entry.userName}</span>
                                  {" "}
                                  {formatAction(entry.action)}
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
                      {(ticket as { assignedToAvatarUrl?: string | null }).assignedToAvatarUrl ? (
                        <AvatarImage src={getAvatarSrc((ticket as { assignedToAvatarUrl?: string | null }).assignedToAvatarUrl)} alt={ticket.assignedToName ?? ""} />
                      ) : null}
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
                          {(ticket as { assignedToAvatarUrl?: string | null }).assignedToAvatarUrl ? (
                            <AvatarImage src={getAvatarSrc((ticket as { assignedToAvatarUrl?: string | null }).assignedToAvatarUrl)} alt={ticket.assignedToName ?? ""} />
                          ) : null}
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

      <ConfirmDialog
        open={confirmDeleteTicket}
        onOpenChange={setConfirmDeleteTicket}
        title="Delete Ticket"
        description="Are you sure you want to delete this ticket? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={executeDelete}
        loading={deleting}
      />

      <ConfirmDialog
        open={!!confirmDeleteAttachment}
        onOpenChange={(o) => { if (!o) setConfirmDeleteAttachment(null); }}
        title="Delete Attachment"
        description="Are you sure you want to delete this attachment?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          const attachmentId = confirmDeleteAttachment;
          setConfirmDeleteAttachment(null);
          if (attachmentId) deleteMutation.mutate(attachmentId);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
