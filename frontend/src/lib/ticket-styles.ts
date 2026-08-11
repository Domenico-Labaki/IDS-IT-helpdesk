export const statusStyles: Record<string, string> = {
  Open: "border border-primary/20 bg-primary/[0.07] text-primary",
  "In Progress": "border border-blue-400/25 bg-blue-400/10 text-blue-700 dark:text-blue-300",
  Resolved: "border border-emerald-500/22 bg-emerald-500/9 text-emerald-700 dark:text-emerald-300",
  Closed: "border border-border bg-muted text-muted-foreground",
  Cancelled: "border border-destructive/20 bg-destructive/[0.07] text-destructive",
  Pending: "border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export const priorityStyles: Record<string, string> = {
  Low: "border border-border bg-muted text-muted-foreground",
  Medium: "border border-primary/16 bg-primary/[0.055] text-primary",
  High: "border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Critical: "border border-destructive/22 bg-destructive/[0.075] text-destructive",
};

export const statusIdMap: Record<number, string> = {
  1: "Open",
  2: "In Progress",
  3: "Resolved",
  4: "Closed",
  5: "Cancelled",
  6: "Pending",
};

export const allowedTransitions: Record<string, number[]> = {
  Open: [2, 5],
  "In Progress": [6, 3],
  Pending: [2, 3],
  Resolved: [4, 2],
  Closed: [],
  Cancelled: [],
};
