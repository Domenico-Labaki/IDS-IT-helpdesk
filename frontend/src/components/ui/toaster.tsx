"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return <SonnerToaster closeButton position="top-right" toastOptions={{ className: "!rounded-xl !border-border !bg-popover !text-popover-foreground !shadow-lg" }} />;
}
