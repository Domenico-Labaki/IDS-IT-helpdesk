export const statusStyles: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-zinc-100 text-zinc-700",
  Cancelled: "bg-red-100 text-red-700",
};

export const priorityStyles: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
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
