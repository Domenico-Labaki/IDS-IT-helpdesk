"use client";

import { SidebarNav } from "@/components/SidebarNav";
import { ChatAssistant } from "@/components/ChatAssistant";
import { useIdleTimer } from "@/hooks/useIdleTimer";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useIdleTimer();

  return (
    <div className="min-h-screen bg-background text-foreground md:pl-[240px]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gradient-1 via-transparent to-transparent dark:from-gradient-1/50" />
      <SidebarNav />
      <main className="relative min-h-screen flex-1 overflow-y-auto p-6 pt-16 md:pt-6">{children}</main>
      <ChatAssistant />
    </div>
  );
}