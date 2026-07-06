export const statusStyles: Record<string, string> = {
  Open: "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 border border-blue-200/50 dark:from-blue-950/30 dark:to-blue-900/20 dark:text-blue-400 dark:border-blue-800/30",
  "In Progress": "bg-gradient-to-br from-yellow-100 to-amber-50 text-yellow-700 border border-yellow-200/50 dark:from-yellow-950/30 dark:to-amber-900/20 dark:text-yellow-400 dark:border-yellow-800/30",
  Resolved: "bg-gradient-to-br from-green-100 to-emerald-50 text-green-700 border border-green-200/50 dark:from-green-950/30 dark:to-emerald-900/20 dark:text-green-400 dark:border-green-800/30",
  Closed: "bg-gradient-to-br from-zinc-100 to-zinc-50 text-zinc-700 border border-zinc-200/50 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-400 dark:border-zinc-700/50",
  Cancelled: "bg-gradient-to-br from-red-100 to-rose-50 text-red-700 border border-red-200/50 dark:from-red-950/30 dark:to-rose-900/20 dark:text-red-400 dark:border-red-800/30",
};

export const priorityStyles: Record<string, string> = {
  Low: "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-700 border border-slate-200/50 dark:from-slate-800 dark:to-slate-900 dark:text-slate-400 dark:border-slate-700/50",
  Medium: "bg-gradient-to-br from-yellow-100 to-amber-50 text-yellow-700 border border-yellow-200/50 dark:from-yellow-950/30 dark:to-amber-900/20 dark:text-yellow-400 dark:border-yellow-800/30",
  High: "bg-gradient-to-br from-orange-100 to-amber-50 text-orange-700 border border-orange-200/50 dark:from-orange-950/30 dark:to-amber-900/20 dark:text-orange-400 dark:border-orange-800/30",
  Critical: "bg-gradient-to-br from-red-100 to-rose-50 text-red-700 border border-red-200/50 dark:from-red-950/30 dark:to-rose-900/20 dark:text-red-400 dark:border-red-800/30",
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
