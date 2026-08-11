"use client";

import { SidebarNav } from "@/components/SidebarNav";
import { ChatAssistant } from "@/components/ChatAssistant";
import { useIdleTimer } from "@/hooks/useIdleTimer";
import { AiAgentProvider } from "@/components/ai/AiAgentProvider";
import { WorkspaceTopbar } from "@/components/WorkspaceTopbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useIdleTimer();

  return (
    <AiAgentProvider>
      <div className="min-h-screen bg-background text-foreground md:pl-[76px] xl:pl-[248px]">
        <SidebarNav />
        <WorkspaceTopbar />
        <main className="relative min-h-[calc(100vh-4rem)] flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        <ChatAssistant />
      </div>
    </AiAgentProvider>
  );
}
