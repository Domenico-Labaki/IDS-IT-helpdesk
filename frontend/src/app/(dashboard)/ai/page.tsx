"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bot, Loader2, Send, ShieldCheck } from "lucide-react";

import { useAiAgent } from "@/components/ai/AiAgentProvider";
import { AiMessageBubble } from "@/components/ai/AiMessageBubble";
import { AiQuickActions } from "@/components/ai/AiQuickActions";
import { AiSessionSidebar } from "@/components/ai/AiSessionSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAiSession, getAiSessions } from "@/lib/api/ai-chat";

export default function AiHubPage() {
  return <AiHubContent />;
}

function AiHubContent() {
  const queryClient = useQueryClient();
  const { activeSessionId, turns, streaming, selectSession, startNewSession, sendMessage, confirmAction, rejectAction } = useAiAgent();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: sessions = [] } = useQuery({ queryKey: ["ai-sessions"], queryFn: getAiSessions });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, streaming]);

  const submit = async (message: string) => {
    if (!message.trim() || streaming) return;
    setInput("");
    await sendMessage(message);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteAiSession(sessionId);
      if (activeSessionId === sessionId) startNewSession();
      await queryClient.invalidateQueries({ queryKey: ["ai-sessions"] });
      toast.success("Chat deleted");
    } catch { toast.error("Failed to delete chat"); }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] min-h-[620px] w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:grid lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_240px]">
      <aside className="hidden border-r border-border bg-muted/20 lg:block">
        <AiSessionSidebar sessions={sessions} activeSessionId={activeSessionId} onSelect={(id) => void selectSession(id)} onNew={startNewSession} onDelete={(id) => void handleDeleteSession(id)} />
      </aside>

      <section className="flex min-h-0 flex-1 flex-col">
        <header className="relative flex items-center gap-3 overflow-hidden border-b border-border px-4 py-4 sm:px-6">
          <div className="signal-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="helix-gradient relative flex size-9 items-center justify-center rounded-xl text-white"><Bot className="size-4" /></div>
          <div className="relative min-w-0 flex-1"><p className="section-label text-primary">Unified helpdesk intelligence</p><h1 className="mt-0.5 text-base font-semibold">HELIX workspace</h1></div>
          <div className="relative flex items-center gap-2 font-mono text-[9px] uppercase tracking-wide text-muted-foreground"><span className="size-1.5 animate-pulse rounded-full bg-primary" />{streaming ? "Processing" : "Ready"}</div>
        </header>

        <div className="border-b border-border p-3 lg:hidden">
          <details>
            <summary className="cursor-pointer list-none text-xs font-semibold text-muted-foreground">Conversation history · {sessions.length}</summary>
            <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-border"><AiSessionSidebar sessions={sessions} activeSessionId={activeSessionId} onSelect={(id) => void selectSession(id)} onNew={startNewSession} onDelete={(id) => void handleDeleteSession(id)} /></div>
          </details>
        </div>

        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl space-y-6">
            {turns.map((turn) => <AiMessageBubble key={turn.turnId} turn={turn} streaming={streaming && turn === turns.at(-1)} onConfirm={(id) => void confirmAction(id)} onReject={(id) => void rejectAction(id)} />)}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <footer className="border-t border-border bg-background/75 p-4 backdrop-blur sm:px-8 sm:py-5">
          <div className="mx-auto max-w-3xl">
            <div className="flex gap-2">
              <Input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(input); } }} placeholder="Ask HELIX to find information or prepare an action..." disabled={streaming} maxLength={4000} className="h-12" />
              <Button onClick={() => void submit(input)} disabled={!input.trim() || streaming} className="size-12 shrink-0" size="icon">{streaming ? <Loader2 className="animate-spin" /> : <Send />}</Button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck className="size-3" />Platform actions require confirmation. Never submit passwords, keys, or secrets.</p>
          </div>
        </footer>
      </section>

      <aside className="hidden border-l border-border bg-muted/20 xl:block"><AiQuickActions onSendPrompt={(message) => void submit(message)} /></aside>
    </div>
  );
}
