"use client";

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon,
  title = "No data found",
  description = "There are no items to display.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border-y border-dashed border-border py-14 text-center">
      <div className="mb-4 rounded-xl border border-border bg-muted/50 p-3 text-muted-foreground">
        {icon ?? <Inbox className="h-12 w-12" />}
      </div>
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
