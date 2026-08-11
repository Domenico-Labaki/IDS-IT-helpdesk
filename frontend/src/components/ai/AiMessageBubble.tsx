"use client";

import Link from "next/link";
import { AlertCircle, ArrowUpRight, Bot, Check, CheckCircle2, Loader2, MessageSquareText, ShieldCheck, Ticket, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiActionTarget, ConversationTurn } from "@/types/ai";

type Props = { turn: ConversationTurn; streaming?: boolean; onConfirm?: (actionId: string) => void; onReject?: (actionId: string) => void };

function getTurnTargets(turn: ConversationTurn): AiActionTarget[] {
  const candidates = turn.assistantMessage.toolResults.flatMap((result) => [
    ...(result.target ? [result.target] : []),
    ...(result.targets ?? []),
  ]);
  if (turn.action?.target) candidates.push(turn.action.target);

  return Array.from(new Map(candidates
    .filter((target) => Boolean(target?.href))
    .map((target) => [target.href, target] as const)).values());
}

export function AiMessageBubble({ turn, streaming, onConfirm, onReject }: Props) {
  const { userMessage, assistantMessage } = turn;
  const targets = getTurnTargets(turn);
  return (
    <article className="space-y-4">
      {userMessage.content && (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground sm:max-w-[75%]">
            <p className="whitespace-pre-wrap">{userMessage.content}</p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="helix-gradient mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-white"><Bot className="size-3.5" /></div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">HELIX</p>
          {assistantMessage.content ? <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/88">{assistantMessage.content}</p> : streaming ? <Loader2 className="size-4 animate-spin text-primary" /> : null}

          {assistantMessage.toolResults.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              {assistantMessage.toolResults.map((result, index) => (
                <div key={`${result.toolCallId || result.name || "tool"}-${index}`} className="flex items-start gap-3 border-b border-border bg-muted/25 p-3 last:border-b-0">
                  {result.success ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> : <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                  <div className="min-w-0"><p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide"><Wrench className="size-3" />{result.name}</p>{result.error && <p className="mt-1 text-xs text-destructive">{result.error}</p>}</div>
                </div>
              ))}
            </div>
          )}

          {targets.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {targets.map((target) => {
                const TargetIcon = target.kind === "comment" ? MessageSquareText : Ticket;
                return (
                  <Link
                    key={target.href}
                    href={target.href}
                    className="group flex min-w-0 items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.045] p-3 transition-colors hover:border-primary/40 hover:bg-primary/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <TargetIcon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">{target.kind}</span>
                      <span className="mt-0.5 block truncate text-xs font-semibold text-foreground">{target.title ?? target.label}</span>
                      {target.subtitle && <span className="mt-1 block truncate text-[10px] text-muted-foreground">{target.subtitle}</span>}
                      <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-primary">
                        {target.label}<ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {turn.action?.status === "Executing" && <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />Executing approved action…</div>}
        </div>
      </div>

      {turn.action?.status === "Pending" && (
        <div className="ml-0 rounded-xl border border-primary/20 bg-primary/[0.055] p-4 sm:ml-10">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold">Confirm platform action</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{turn.action.summary}</p></div>
          </div>
          <div className="mt-3 flex gap-2 sm:ml-7"><Button size="xs" onClick={() => onConfirm?.(turn.action!.id)}><Check />Confirm</Button><Button size="xs" variant="outline" onClick={() => onReject?.(turn.action!.id)}><X />Cancel</Button></div>
        </div>
      )}
    </article>
  );
}
