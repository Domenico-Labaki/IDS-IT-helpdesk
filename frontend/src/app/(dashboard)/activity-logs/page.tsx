"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterChips } from "@/components/FilterChips";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ChevronLeft, ChevronRight, Filter, ClipboardList, Info, X } from "lucide-react";
import { getActivityLogs, type ActivityLogEntry } from "@/lib/api/settings";
import { formatAction } from "@/lib/format-activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarSrc } from "@/lib/avatar";
import { getUsers } from "@/lib/api/users";
import type { User } from "@/types";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [userFilter, setUserFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: users } = useQuery({ queryKey: ["users"], queryFn: getUsers, staleTime: 60000 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize: 30 };
      if (userFilter && userFilter !== "all") params.userId = userFilter;
      if (entityFilter) params.entityType = entityFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const result = await getActivityLogs(params);
      setLogs(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, userFilter, entityFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const clearFilters = () => {
    setUserFilter("all");
    setEntityFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const filterChips = [];
  const selectedUser = users?.find((u) => u.id === userFilter);
  if (userFilter && userFilter !== "all") filterChips.push({ label: `User: ${selectedUser?.fullName ?? userFilter}`, onRemove: () => { setUserFilter(""); setPage(1); } });
  if (entityFilter) filterChips.push({ label: `Entity: ${entityFilter}`, onRemove: () => { setEntityFilter(""); setPage(1); } });
  if (dateFrom) filterChips.push({ label: `From: ${dateFrom}`, onRemove: () => { setDateFrom(""); setPage(1); } });
  if (dateTo) filterChips.push({ label: `To: ${dateTo}`, onRemove: () => { setDateTo(""); setPage(1); } });

  const [metadataPopoverId, setMetadataPopoverId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const [popoverData, setPopoverData] = useState<Record<string, string>>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  const openMetadataPopover = (logId: string, metadata: string, buttonEl: HTMLElement) => {
    const rect = buttonEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const above = spaceBelow < 300 && spaceAbove > spaceBelow;
    setPopoverPos({
      top: above ? rect.top - 8 : rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 360),
      above,
    });
    try {
      const parsed = JSON.parse(metadata);
      setPopoverData(typeof parsed === "object" && parsed !== null ? parsed : { value: metadata });
    } catch {
      setPopoverData({ value: metadata });
    }
    setMetadataPopoverId(logId);
  };

  const closeMetadataPopover = () => {
    setMetadataPopoverId(null);
    setPopoverPos(null);
  };

  useEffect(() => {
    if (!metadataPopoverId) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closeMetadataPopover();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMetadataPopover();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [metadataPopoverId]);

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Logs" description="View system-wide activity and audit trail" />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by user, entity type, or date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-4">
            <div className="space-y-1">
              <Label>User</Label>
              <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Entity Type</Label>
              <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Ticket">Ticket</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1">
              <Label>To</Label>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1 flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
          </div>

          <FilterChips chips={filterChips} />

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-12 w-12" />}
              title="No activity logs found"
              description={userFilter || entityFilter || dateFrom || dateTo ? "Try adjusting your filters." : "No system activity has been recorded yet."}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground border-b text-xs uppercase">
                  <tr>
                    <th className="px-3 py-3 font-medium">Time</th>
                    <th className="px-3 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                    <th className="px-3 py-3 font-medium">Entity Type</th>
                    <th className="px-3 py-3 font-medium">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-b-0 hover:bg-muted/50">
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(log.performedAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={getAvatarSrc(log.userAvatarUrl)} alt={log.userName} />
                            <AvatarFallback className="text-[10px]">{getInitials(log.userName)}</AvatarFallback>
                          </Avatar>
                          <span>{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          log.action === "COMMENT_ADDED" ? "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800/30" :
                          log.action === "TicketCreated" || log.action === "Created" ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30" :
                          log.action === "TicketUpdated" || log.action === "Updated" ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30" :
                          log.action === "TicketDeleted" || log.action === "Deleted" ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30" :
                          log.action === "TICKET_ASSIGNED" || log.action === "TICKET_UNASSIGNED" || log.action === "Assigned" || log.action === "Unassigned" ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/30" :
                          log.action === "STATUS_CHANGED" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30" :
                          log.action === "TICKET_ESCALATED" ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/30" :
                          "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                        }`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-3 py-3">{log.entityType}</td>
                      <td className="px-3 py-3">
                        {log.metadata && log.metadata !== "{}" ? (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => openMetadataPopover(log.id, log.metadata, e.currentTarget)}
                          >
                            <Info className="h-4 w-4 mr-1" />
                            More Info
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {metadataPopoverId && popoverPos && (
            <div ref={popoverRef} className="fixed z-50" style={{ top: popoverPos.top, left: popoverPos.left }}>
              <div className={`bg-popover border rounded-xl shadow-xl min-w-[280px] max-w-[360px] ${popoverPos.above ? "mb-2" : "mt-2"}`}>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <span className="text-sm font-semibold">Metadata</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeMetadataPopover}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-4 max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      {Object.entries(popoverData).map(([key, value]) => (
                        <tr key={key} className="border-b last:border-b-0">
                          <td className="py-1.5 pr-3 font-medium text-muted-foreground capitalize whitespace-nowrap">{key.replace(/([A-Z])/g, " $1").trim()}</td>
                          <td className="py-1.5 text-right font-mono break-all max-w-[200px]">{typeof value === "string" ? value : JSON.stringify(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({totalCount} total)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
