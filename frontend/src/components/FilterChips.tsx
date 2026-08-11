"use client";

import { X } from "lucide-react";

type Chip = {
  label: string;
  onRemove: () => void;
};

type FilterChipsProps = {
  chips: Chip[];
};

export function FilterChips({ chips }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="inline-flex items-center justify-center rounded-full p-0.5 hover:bg-muted hover:text-foreground transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
