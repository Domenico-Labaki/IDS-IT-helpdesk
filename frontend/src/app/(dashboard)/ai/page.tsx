"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bot, Loader2, Send } from "lucide-react";

import { useAiAgent } from "@/components/ai/AiAgentProvider";
import { AiMessageBubble } from "@/components/ai/AiMessageBubble";
import { AiQuickActions } from "@/components/ai/AiQuickActions";
import { AiSessionSidebar } from "@/components/ai/AiSessionSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAiSession, getAiSessions } from "@/lib/api/ai-chat";

export default function AiHubPage() {
  // The dashboard layout owns the provider. Keeping this component focused on
  // presentation ensures the floating assistant and hub share one conversation.
  return <AiHubContent />;
}

function AiHubContent() {
  const queryClient = useQueryClient();
  const {
    activeSessionId,
    turns,
    streaming,
    selectSession,
    startNewSession,
    sendMessage,
    confirmAction,
    rejectAction,
  } = useAiAgent();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: sessions = [] } = useQuery({ queryKey: ["ai-sessions"], queryFn: getAiSessions });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, streaming]);

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
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-0 -m-6">
      <div className="w-64 border-r bg-card shrink-0 flex flex-col">
        <AiSessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={(sessionId) => void selectSession(sessionId)}
          onNew={startNewSession}
          onDelete={(sessionId) => void handleDeleteSession(sessionId)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b px-6 py-3 flex items-center gap-3">
          <Bot className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">HELIX</h2>
            <p className="text-xs text-muted-foreground">
              Unified helpdesk agent
              {streaming && <span className="ml-2 text-primary">(working...)</span>}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {turns.map((turn) => (
            <AiMessageBubble
              key={turn.turnId}
              turn={turn}
              streaming={streaming && turn === turns.at(-1)}
              onConfirm={(actionId) => void confirmAction(actionId)}
              onReject={(actionId) => void rejectAction(actionId)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submit(input);
                  }
                }}
                placeholder="Ask HELIX to find information or prepare an action..."
                disabled={streaming}
                maxLength={4000}
                className="h-10"
              />
              <Button
                onClick={() => void submit(input)}
                disabled={!input.trim() || streaming}
                className="h-10 w-10 shrink-0"
                size="icon"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              HELIX messages are processed by Groq. Do not submit passwords, API keys, or other secrets.
            </p>
          </div>
        </div>
      </div>

      <div className="w-56 border-l bg-card shrink-0 hidden xl:block">
        <AiQuickActions onSendPrompt={(message) => void submit(message)} />
      </div>
    </div>
  );
}
