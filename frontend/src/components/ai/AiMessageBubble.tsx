"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpRight, Check, CheckCircle2, Loader2, MessageSquare, Ticket, X } from "lucide-react";
import type { ConversationTurn } from "@/types/ai";

type Props = {
  turn: ConversationTurn;
  streaming?: boolean;
  onConfirm?: (actionId: string) => void;
  onReject?: (actionId: string) => void;
};

export function AiMessageBubble({
  turn,
  streaming,
  onConfirm,
  onReject,
}: Props) {
  const { userMessage, assistantMessage } = turn;
  const actionTarget = turn.action?.status === "Succeeded"
    ? turn.action.result?.target
    : null;

  return (
    <div className="space-y-2">
      {/* User message */}
      {userMessage.content && (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm bg-primary text-primary-foreground">
            <p className="whitespace-pre-wrap">{userMessage.content}</p>
          </div>
        </div>
      )}

      {/* Assistant response */}
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm bg-muted text-muted-foreground">
          {assistantMessage.content ? (
            <p className="whitespace-pre-wrap">{assistantMessage.content}</p>
          ) : streaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}

          {/* Tool results inline */}
          {assistantMessage.toolResults.length > 0 && (
            <div className="mt-2 space-y-1 border-t pt-2">
              {assistantMessage.toolResults.map((tr) => (
                <div
                  key={tr.toolCallId}
                  className={`p-2 rounded text-xs ${
                    tr.success
                      ? "bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800"
                      : "bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800"
                  }`}
                >
                  <span className="font-medium">
                    {tr.success ? "\u2705" : "\u274C"} {tr.name}
                  </span>
                  {tr.error && (
                    <p className="text-red-600 dark:text-red-400 mt-1">{tr.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Executing tool spinner */}
          {turn.action?.status === "Executing" && (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Executing actions...
            </div>
          )}
        </div>
      </div>

      {/* Pending tool confirmations */}
      {turn.action?.status === "Pending" && (
        <div
          className="ml-[20%] p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
        >
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
            Confirm platform action
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
            {turn.action.summary}
          </p>
          <div className="flex gap-2">
            <Button size="xs" variant="default" onClick={() => onConfirm?.(turn.action!.id)}>
              <Check className="h-3 w-3 mr-1" />
              Confirm
            </Button>
            <Button size="xs" variant="outline" onClick={() => onReject?.(turn.action!.id)}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {actionTarget && (
        <Link
          href={actionTarget.href}
          className="group ml-[20%] flex items-center gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={actionTarget.label}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {actionTarget.kind === "comment" ? (
              <MessageSquare className="h-4 w-4" />
            ) : (
              <Ticket className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Action completed
            </div>
            <p className="truncate text-sm font-medium">{actionTarget.label}</p>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
