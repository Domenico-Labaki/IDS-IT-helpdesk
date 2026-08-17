import type { ReactNode } from "react";
import { Activity, ArrowUpRight, ShieldCheck } from "lucide-react";
import { HelixLogoMark } from "@/components/HelixLogoMark";

type AuthShellProps = { eyebrow: string; title: string; description: string; children: ReactNode };

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,.92fr)]">
      <aside className="helix-gradient relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="signal-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="absolute -right-32 -top-32 size-[520px] rounded-full border border-white/10" />
        <div className="absolute -right-12 -top-12 size-[360px] rounded-full border border-white/15" />
        <div className="relative flex items-center gap-3">
          <HelixLogoMark className="size-11 ring-1 ring-white/25" />
          <div><p className="text-sm font-semibold">HELIX AI Helpdesk</p><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/65">Intelligent IT operations</p></div>
        </div>

        <div className="relative max-w-2xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/62">Future-ready support infrastructure</p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.055em] xl:text-5xl">Every support signal, one clear operating system.</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/72">Resolve issues, coordinate teams, and move from insight to approved action with HELIX at the center.</p>
        </div>

        <div className="relative grid grid-cols-3 overflow-hidden rounded-xl border border-white/18 bg-black/10 backdrop-blur">
          <div className="border-r border-white/15 p-4"><ShieldCheck className="mb-3 size-4" /><p className="text-xs font-semibold">Protected</p><p className="mt-1 text-[10px] text-white/60">Role-based access</p></div>
          <div className="border-r border-white/15 p-4"><Activity className="mb-3 size-4" /><p className="text-xs font-semibold">Connected</p><p className="mt-1 text-[10px] text-white/60">Live operations</p></div>
          <div className="p-4"><ArrowUpRight className="mb-3 size-4" /><p className="text-xs font-semibold">Intelligent</p><p className="mt-1 text-[10px] text-white/60">HELIX assisted</p></div>
        </div>
      </aside>

      <section className="relative flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="signal-grid pointer-events-none absolute inset-x-0 top-0 h-48 opacity-50 lg:hidden" />
        <div className="relative w-full max-w-md">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <HelixLogoMark className="size-10" />
            <div><p className="text-sm font-semibold">HELIX AI Helpdesk</p><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Intelligent IT operations</p></div>
          </div>
          <p className="section-label text-primary">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Authorized personnel only · Activity is monitored</p>
        </div>
      </section>
    </main>
  );
}
