"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { getActivityLogs, type ActivityLogEntry } from "@/lib/api/settings";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [userFilter, setUserFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize: 30 };
      if (userFilter) params.userId = userFilter;
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
    setUserFilter("");
    setEntityFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Activity Logs</h1>
        <p className="text-muted-foreground">View system-wide activity and audit trail</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by user, entity type, or date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-4">
            <div className="space-y-1">
              <Label>User</Label>
              <Input value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1); }} placeholder="Filter by user ID" />
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

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground">No activity logs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground border-b text-xs uppercase">
                  <tr>
                    <th className="px-3 py-3 font-medium">Time</th>
                    <th className="px-3 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                    <th className="px-3 py-3 font-medium">Entity Type</th>
                    <th className="px-3 py-3 font-medium">Entity ID</th>
                    <th className="px-3 py-3 font-medium">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-b-0 hover:bg-muted/50">
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(log.performedAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">{log.userName}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3 py-3">{log.entityType}</td>
                      <td className="px-3 py-3 font-mono text-xs">{log.entityId?.slice(0, 8) ?? "-"}</td>
                      <td className="px-3 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{log.metadata}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
