"use client";

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
    <div className="p-4">
      <p className="section-label mb-1 text-primary">Prompt library</p>
      <h3 className="mb-4 text-sm font-semibold">Fast paths</h3>
      <div className="divide-y divide-border">
        {actions.map((action) => (
          <button
            type="button"
            key={action.label}
            className="group flex w-full items-center gap-3 py-3 text-left text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => onSendPrompt(action.prompt)}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"><action.icon className="size-3.5" /></span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
