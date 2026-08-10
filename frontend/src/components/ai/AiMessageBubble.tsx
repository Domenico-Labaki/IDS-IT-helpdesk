"use client";

import { Button } from "@/components/ui/button";
import { Check, Loader2, X } from "lucide-react";
import type { AiToolCallDto, ConversationTurn } from "@/types/ai";

type Props = {
  turn: ConversationTurn;
  streaming?: boolean;
  pendingConfirmations: Map<string, AiToolCallDto>;
  executingTools: Set<string>;
  onConfirm?: (toolCallId: string) => void;
  onReject?: (toolCallId: string) => void;
};

export function AiMessageBubble({
  turn,
  streaming,
  pendingConfirmations,
  executingTools,
  onConfirm,
  onReject,
}: Props) {
  const { userMessage, assistantMessage } = turn;

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
          {executingTools.size > 0 && (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Executing actions...
            </div>
          )}
        </div>
      </div>

      {/* Pending tool confirmations */}
      {Array.from(pendingConfirmations.entries()).map(([id, tc]) => (
        <div
          key={id}
          className="ml-[20%] p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
        >
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
            {"\u26A0"} Confirm action: {tc.name}
          </p>
          {tc.arguments && (
            <pre className="text-xs text-amber-600 dark:text-amber-400 mb-2 overflow-x-auto">
              {JSON.stringify(tc.arguments, null, 2)}
            </pre>
          )}
          <div className="flex gap-2">
            <Button size="xs" variant="default" onClick={() => onConfirm?.(id)}>
              <Check className="h-3 w-3 mr-1" />
              Confirm
            </Button>
            <Button size="xs" variant="outline" onClick={() => onReject?.(id)}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
