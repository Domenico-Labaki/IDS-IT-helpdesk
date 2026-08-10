"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AiMessageBubble } from "@/components/ai/AiMessageBubble";
import { AiQuickActions } from "@/components/ai/AiQuickActions";
import { AiSessionSidebar } from "@/components/ai/AiSessionSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatStream, deleteAiSession, getAiSessionMessages, getAiSessions } from "@/lib/api/ai-chat";
import type { AiMessage, AiToolCallDto, ConversationTurn, AiToolResultDto } from "@/types/ai";
import { Bot, Loader2, Send } from "lucide-react";

export default function AiHubPage() {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [pendingConfirmations, setPendingConfirmations] = useState<Map<string, AiToolCallDto>>(new Map());
  const [executingTools, setExecutingTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions = [] } = useQuery({
    queryKey: ["ai-sessions"],
    queryFn: getAiSessions,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, streaming]);

  // Load messages grouped into turns
  useEffect(() => {
    if (activeSessionId) {
      getAiSessionMessages(activeSessionId)
        .then((msgs) => {
          const grouped = new Map<string, AiMessage[]>();
          for (const m of msgs) {
            if (!grouped.has(m.turnId)) grouped.set(m.turnId, []);
            grouped.get(m.turnId)!.push(m);
          }
          const conversationTurns: ConversationTurn[] = [];
          for (const [, group] of grouped) {
            const userMsg = group.find((m) => m.role === "user");
            const toolMsgs = group.filter((m) => m.role === "tool");
            const assistantMsg = group.find((m) => m.role === "assistant");
            if (userMsg && assistantMsg) {
              const toolResults: AiToolResultDto[] = toolMsgs
                .filter((m) => m.toolResultJson)
                .map((m) => {
                  try { return JSON.parse(m.toolResultJson!); }
                  catch { return { toolCallId: m.toolCallId, name: m.toolName, success: false, error: m.content }; }
                });
              conversationTurns.push({
                turnId: group[0].turnId,
                userMessage: { content: userMsg.content, createdAt: userMsg.createdAt },
                assistantMessage: { content: assistantMsg.content, toolResults, createdAt: assistantMsg.createdAt },
              });
            }
          }
          setTurns(conversationTurns);
        })
        .catch(() => setTurns([]));
    } else {
      setTurns([{
        turnId: "welcome",
        userMessage: { content: "", createdAt: "" },
        assistantMessage: {
          content: "Hi! I'm **HELIX**, your AI assistant for the IDS IT Helpdesk. I can help you:\n\n- Create and manage tickets\n- Check ticket statuses and dashboard stats\n- Suggest categories and priorities\n- Assign tickets to agents\n- Add comments to tickets\n- And more!\n\nWhat would you like to do?",
          toolResults: [],
          createdAt: new Date().toISOString(),
        },
      }]);
    }
  }, [activeSessionId]);

  const updateLastTurn = useCallback(
    (updater: (turn: ConversationTurn) => ConversationTurn) => {
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = updater(updated[updated.length - 1]);
        return updated;
      });
    },
    [],
  );

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    setInput("");

    const turnId = crypto.randomUUID();
    const newTurn: ConversationTurn = {
      turnId,
      userMessage: { content: text, createdAt: new Date().toISOString() },
      assistantMessage: { content: "", toolResults: [], createdAt: new Date().toISOString() },
    };
    setTurns((prev) => [...prev, newTurn]);
    setStreaming(true);

    let fullContent = "";

    const sid = await chatStream(text, activeSessionId, undefined, {
      onText: (chunk) => {
        fullContent += chunk;
        updateLastTurn((turn) => ({
          ...turn,
          assistantMessage: { ...turn.assistantMessage, content: fullContent },
        }));
      },
      onToolCall: (tc) => {
        const destructiveTools = ["delete_ticket", "unassign_ticket", "update_ticket_status"];
        if (destructiveTools.includes(tc.name)) {
          setPendingConfirmations((prev) => {
            const next = new Map(prev);
            next.set(tc.id, tc);
            return next;
          });
        } else {
          executeTool(tc);
        }
      },
      onToolResult: (tr) => {
        updateLastTurn((turn) => ({
          ...turn,
          assistantMessage: {
            ...turn.assistantMessage,
            toolResults: [...turn.assistantMessage.toolResults, tr],
          },
        }));
        setExecutingTools((prev) => {
          const next = new Set(prev);
          next.delete(tr.toolCallId);
          return next;
        });
      },
      onDone: () => {
        setStreaming(false);
        queryClient.invalidateQueries({ queryKey: ["ai-sessions"] });
      },
      onError: (error) => {
        updateLastTurn((turn) => ({
          ...turn,
          assistantMessage: {
            ...turn.assistantMessage,
            content: `Sorry, I encountered an error: ${error}`,
          },
        }));
        setStreaming(false);
      },
    });

    if (sid && !activeSessionId) {
      setActiveSessionId(sid);
      queryClient.invalidateQueries({ queryKey: ["ai-sessions"] });
    }
  };

  const executeTool = async (tc: AiToolCallDto) => {
    setExecutingTools((prev) => new Set(prev).add(tc.id));
    setPendingConfirmations((prev) => {
      const next = new Map(prev);
      next.delete(tc.id);
      return next;
    });

    const turnId = crypto.randomUUID();
    const newTurn: ConversationTurn = {
      turnId,
      userMessage: { content: `(confirmed) ${tc.name}`, createdAt: new Date().toISOString() },
      assistantMessage: { content: "", toolResults: [], createdAt: new Date().toISOString() },
    };
    setTurns((prev) => [...prev, newTurn]);
    setStreaming(true);

    let fc = "";
    await chatStream(`HELIX, please proceed with: ${tc.name}(${JSON.stringify(tc.arguments ?? {})})`, activeSessionId, undefined, {
      onText: (chunk) => {
        fc += chunk;
        updateLastTurn((turn) => ({
          ...turn,
          assistantMessage: { ...turn.assistantMessage, content: fc },
        }));
      },
      onToolResult: (tr) => {
        updateLastTurn((turn) => ({
          ...turn,
          assistantMessage: {
            ...turn.assistantMessage,
            toolResults: [...turn.assistantMessage.toolResults, tr],
          },
        }));
        setExecutingTools((prev) => {
          const next = new Set(prev);
          next.delete(tr.toolCallId);
          return next;
        });
      },
      onDone: () => {
        setStreaming(false);
        queryClient.invalidateQueries({ queryKey: ["ai-sessions"] });
      },
    });
  };

  const confirmTool = (toolCallId: string) => {
    const tc = pendingConfirmations.get(toolCallId);
    if (tc) executeTool(tc);
  };

  const rejectTool = (toolCallId: string) => {
    setPendingConfirmations((prev) => {
      const next = new Map(prev);
      next.delete(toolCallId);
      return next;
    });
    updateLastTurn((turn) => ({
      ...turn,
      assistantMessage: {
        ...turn.assistantMessage,
        content: turn.assistantMessage.content + "\n\n*Action cancelled.*",
      },
    }));
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setTurns([]);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteAiSession(id);
      queryClient.invalidateQueries({ queryKey: ["ai-sessions"] });
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setTurns([]);
      }
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-0 -m-6">
      <div className="w-64 border-r bg-card shrink-0 flex flex-col">
        <AiSessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={setActiveSessionId}
          onNew={handleNewSession}
          onDelete={handleDeleteSession}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b px-6 py-3 flex items-center gap-3">
          <Bot className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">HELIX</h2>
            <p className="text-xs text-muted-foreground">
              AI Digital Navigator
              {streaming && <span className="ml-2 text-primary">(streaming...)</span>}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {turns.map((turn) => (
            <AiMessageBubble
              key={turn.turnId}
              turn={turn}
              streaming={streaming && turn === turns[turns.length - 1]}
              pendingConfirmations={pendingConfirmations}
              executingTools={executingTools}
              onConfirm={confirmTool}
              onReject={rejectTool}
            />
          ))}
          {streaming && turns.length > 0 && turns[turns.length - 1].assistantMessage.content === "" && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm bg-muted text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask HELIX to create a ticket, find information, or help you..."
              disabled={streaming}
              className="h-10"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="h-10 w-10 shrink-0"
              size="icon"
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="w-56 border-l bg-card shrink-0 hidden xl:block">
        <AiQuickActions onSendPrompt={sendMessage} />
      </div>
    </div>
  );
}
