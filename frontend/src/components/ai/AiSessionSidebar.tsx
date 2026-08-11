"use client";

import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiSession } from "@/types/ai";

type Props = {
  sessions: AiSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

export function AiSessionSidebar({ sessions, activeSessionId, onSelect, onNew, onDelete }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] shrink-0 items-center border-b border-border px-3">
        <Button onClick={onNew} variant="outline" className="w-full justify-start text-xs">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2">
        {sessions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No previous chats
          </p>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              "group flex cursor-pointer items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-xs transition-colors",
              activeSessionId === session.id
                ? "border-primary/15 bg-primary/[0.07] font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            onClick={() => onSelect(session.id)}
          >
            <span className="truncate flex-1">{session.title}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              aria-label={`Delete ${session.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
