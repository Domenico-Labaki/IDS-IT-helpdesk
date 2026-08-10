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
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button onClick={onNew} variant="outline" className="w-full justify-start gap-2 text-sm">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No previous chats
          </p>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              "group flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
              activeSessionId === session.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground",
            )}
            onClick={() => onSelect(session.id)}
          >
            <span className="truncate flex-1">{session.title}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 group-hover:opacity-100 shrink-0"
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
