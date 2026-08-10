"use client";

import { Button } from "@/components/ui/button";
import { Bot, Plus, Search, BarChart3 } from "lucide-react";

type Props = {
  onSendPrompt: (prompt: string) => void;
};

const actions = [
  {
    label: "Create a ticket",
    prompt: "Create a new ticket for me. I'll provide the details.",
    icon: Plus,
  },
  {
    label: "Find my tickets",
    prompt: "Show me my open tickets.",
    icon: Search,
  },
  {
    label: "Dashboard stats",
    prompt: "What are the current dashboard statistics?",
    icon: BarChart3,
  },
  {
    label: "Check SLA",
    prompt: "Show me the SLA compliance status.",
    icon: Bot,
  },
];

export function AiQuickActions({ onSendPrompt }: Props) {
  return (
    <div className="p-3">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Quick Actions
      </h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs h-auto py-2"
            onClick={() => onSendPrompt(action.prompt)}
          >
            <action.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
