"use client";

import { useEffect, useState } from "react";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedState = window.localStorage.getItem("sidebar-collapsed");
    if (savedState === null) return;

    const timer = window.setTimeout(() => setSidebarCollapsed(savedState === "true"), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSidebarCollapsedChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    window.localStorage.setItem("sidebar-collapsed", String(collapsed));
  };

  return (
    <AiAgentProvider>
      <div className={`min-h-screen bg-background text-foreground transition-[padding] duration-200 ${sidebarCollapsed ? "md:pl-[76px]" : "md:pl-[248px]"}`}>
        <SidebarNav collapsed={sidebarCollapsed} onCollapsedChange={handleSidebarCollapsedChange} />
        <WorkspaceTopbar />
        <main className="relative min-h-[calc(100vh-4rem)] flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        <ChatAssistant />
      </div>
    </AiAgentProvider>
  );
}
