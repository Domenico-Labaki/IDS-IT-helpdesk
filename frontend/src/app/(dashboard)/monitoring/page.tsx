"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Database, RefreshCw, Server, Ticket, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { getHealthStatus, getSystemMetrics, getSystemInfo } from "@/lib/api/settings";

export default function MonitoringPage() {
  const { data: health, refetch: refetchHealth } = useQuery({ queryKey: ["health"], queryFn: getHealthStatus, refetchInterval: 30000 });
  const { data: metrics } = useQuery({ queryKey: ["metrics"], queryFn: getSystemMetrics, refetchInterval: 60000 });
  const { data: sysInfo } = useQuery({ queryKey: ["system-info"], queryFn: getSystemInfo });
  const apiHealthy = health?.status === "Healthy";
  const dbHealthy = health?.database === "Connected";
  const activePercent = metrics?.activeUsersLast24h && metrics?.totalUsers ? Math.min((metrics.activeUsersLast24h / metrics.totalUsers) * 100, 100) : 0;

  return (
    <div className="workspace-page">
      <PageHeader title="System monitoring" description="Live health, activity, and platform telemetry without the noise.">
        <Button variant="outline" onClick={() => void refetchHealth()}><RefreshCw />Refresh signal</Button>
      </PageHeader>

      <section className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-2">
        <div className={`relative overflow-hidden border-b border-border p-6 lg:border-b-0 lg:border-r ${apiHealthy ? "bg-primary/[0.045]" : "bg-destructive/[0.045]"}`}>
          <div className="signal-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative flex items-start justify-between"><div><p className="section-label">Application interface</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">API {health?.status ?? "Unknown"}</h2><p className="mt-2 font-mono text-[10px] text-muted-foreground">Uptime · {health?.uptime ?? "—"}</p></div>{apiHealthy ? <CheckCircle2 className="size-7 text-primary" /> : <XCircle className="size-7 text-destructive" />}</div>
        </div>
        <div className={`relative overflow-hidden p-6 ${dbHealthy ? "bg-primary/[0.025]" : "bg-destructive/[0.045]"}`}>
          <div className="signal-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex items-start justify-between"><div><p className="section-label">Data layer</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Database {health?.database ?? "Unknown"}</h2><p className="mt-2 font-mono text-[10px] text-muted-foreground">{sysInfo?.version ?? "—"} · {sysInfo?.lastUpdated ?? "—"}</p></div><Database className={`size-7 ${dbHealthy ? "text-primary" : "text-destructive"}`} /></div>
        </div>
      </section>

      <section className="grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Users />} label="Active users · 24h" value={metrics?.activeUsersLast24h ?? 0} note={`${metrics?.totalUsers ?? 0} registered`}>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${activePercent}%` }} /></div>
        </Metric>
        <Metric icon={<Ticket />} label="Tickets created · 24h" value={metrics?.ticketsCreatedLast24h ?? 0} note="New demand" />
        <Metric icon={<CheckCircle2 />} label="Tickets resolved · 24h" value={metrics?.ticketsResolvedLast24h ?? 0} note="Completed work" />
        <Metric icon={<Activity />} label="Net activity · 24h" value={(metrics?.ticketsCreatedLast24h ?? 0) + (metrics?.ticketsResolvedLast24h ?? 0)} note="Recorded transitions" />
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border p-5"><div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Server className="size-4" /></div><div><p className="section-label">Platform identity</p><h2 className="mt-1 text-base font-semibold">System overview</h2></div></div>
        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {[{ label: "Total tickets", value: sysInfo?.totalTickets ?? 0 }, { label: "Total users", value: sysInfo?.totalUsers ?? 0 }, { label: "Application version", value: sysInfo?.version ?? "—" }, { label: "Last updated", value: sysInfo?.lastUpdated ?? "—" }].map((item) => <div key={item.label} className="p-5"><p className="section-label">{item.label}</p><p className="mt-3 font-mono text-lg font-semibold">{item.value}</p></div>)}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value, note, children }: { icon: React.ReactNode; label: string; value: number; note: string; children?: React.ReactNode }) {
  return <div className="border-b border-r border-border p-5 last:border-r-0"><div className="flex items-center justify-between text-muted-foreground"><p className="text-xs font-semibold">{label}</p><span className="[&_svg]:size-4">{icon}</span></div><p className="mt-4 font-mono text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{note}</p>{children}</div>;
}
