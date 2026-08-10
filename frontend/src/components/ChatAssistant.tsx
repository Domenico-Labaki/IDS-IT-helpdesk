"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { chatStream } from "@/lib/api/ai-chat";
import { Bot, Check, Loader2, MessageCircle, Send, X } from "lucide-react";
import type { AiToolCallDto, AiToolResultDto } from "@/types/ai";

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  toolCalls?: AiToolCallDto[];
  toolResults?: AiToolResultDto[];
  createdAt: string;
};

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm **HELIX**, your AI assistant. I can help you navigate the platform, create tickets, check statuses, and more!",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingConfirmations, setPendingConfirmations] = useState<Map<string, AiToolCallDto>>(new Map());
  const [executingTools, setExecutingTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // On mount, create a session
  useEffect(() => {
    if (open && !sessionId) {
      // Session will be created on first message sent via the SSE response
    }
  }, [open, sessionId]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateLastAssistant = useCallback((updater: (msg: ChatMessage) => ChatMessage) => {
    setMessages((prev) => {
      const idx = prev.length - 1;
      if (idx < 0 || prev[idx].role !== "assistant") return prev;
      const updated = [...prev];
      updated[idx] = updater(updated[idx]);
      return updated;
    });
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);
    setStreaming(true);

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      toolCalls: [],
      toolResults: [],
      createdAt: new Date().toISOString(),
    };
    addMessage(assistantMsg);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    let fullContent = "";

    const sid = await chatStream(text, sessionId, history, {
      onText: (chunk: string) => {
        fullContent += chunk;
        updateLastAssistant((msg) => ({ ...msg, content: fullContent }));
      },
      onToolCall: (tc: AiToolCallDto) => {
        // Check if this is a destructive action
        const destructiveTools = [
          "delete_ticket",
          "unassign_ticket",
          "update_ticket_status",
        ];
        if (destructiveTools.includes(tc.name)) {
          setPendingConfirmations((prev) => {
            const next = new Map(prev);
            next.set(tc.id, tc);
            return next;
          });
        } else {
          // Auto-execute non-destructive tools
          executeTool(tc);
        }
      },
      onToolResult: (tr: AiToolResultDto) => {
        updateLastAssistant((msg) => ({
          ...msg,
          toolResults: [...(msg.toolResults ?? []), tr],
        }));
        setExecutingTools((prev) => {
          const next = new Set(prev);
          next.delete(tr.toolCallId);
          return next;
        });
      },
      onDone: () => {
        setStreaming(false);
      },
      onError: (error: string) => {
        updateLastAssistant((msg) => ({
          ...msg,
          content: `Sorry, I encountered an error: ${error}`,
        }));
        setStreaming(false);
      },
    });

    if (sid) {
      setSessionId(sid);
    }
  };

  const executeTool = async (tc: AiToolCallDto) => {
    setExecutingTools((prev) => new Set(prev).add(tc.id));
    setPendingConfirmations((prev) => {
      const next = new Map(prev);
      next.delete(tc.id);
      return next;
    });

    // Re-send request with implicit confirmation
    const text = `HELIX, please proceed with: ${tc.name}(${JSON.stringify(tc.arguments ?? {})})`;
    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: `(confirmed) ${tc.name}`,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);

    await chatStream(text, sessionId, history, {
      onText: (chunk: string) => {
        // Since we already sent the message, this response will be a new assistant message
      },
      onToolResult: (tr: AiToolResultDto) => {
        updateLastAssistant((msg) => ({
          ...msg,
          toolResults: [...(msg.toolResults ?? []), tr],
        }));
      },
      onDone: () => {
        setStreaming(false);
      },
    });
  };

  const confirmTool = (toolCallId: string) => {
    const tc = pendingConfirmations.get(toolCallId);
    if (tc) {
      executeTool(tc);
    }
  };

  const rejectTool = (toolCallId: string) => {
    setPendingConfirmations((prev) => {
      const next = new Map(prev);
      next.delete(toolCallId);
      return next;
    });
    updateLastAssistant((msg) => ({
      ...msg,
      content: msg.content + "\n\n*Action cancelled.*",
    }));
  };

  return (
    <>
      {open && (
        <Card className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 shadow-2xl border-sidebar-border animate-in slide-in-from-bottom-4 duration-200">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              HELIX AI
            </CardTitle>
            <div className="flex items-center gap-1">
              {sessionId && (
                <span className="h-2 w-2 rounded-full bg-green-500" title="Connected" />
              )}
              <Button variant="ghost" size="icon-xs" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-80 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                  {/* Pending tool calls that need confirmation */}
                  {msg.role === "assistant" &&
                    Array.from(pendingConfirmations.entries()).map(([id, tc]) => (
                      <div key={id} className="mt-2 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
                          ⚠️ Confirm action: {tc.name}
                        </p>
                        {tc.arguments && (
                          <pre className="text-xs text-amber-600 dark:text-amber-400 mb-2 overflow-x-auto">
                            {JSON.stringify(tc.arguments, null, 2)}
                          </pre>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            variant="default"
                            onClick={() => confirmTool(id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => rejectTool(id)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  {/* Tool results */}
                  {msg.role === "assistant" &&
                    msg.toolResults?.map((tr) => (
                      <div
                        key={tr.toolCallId}
                        className={`mt-1 p-2 rounded text-xs ${
                          tr.success
                            ? "bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800"
                            : "bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800"
                        }`}
                      >
                        <span className="font-medium">
                          {tr.success ? "✅" : "❌"} {tr.name}
                        </span>
                        {tr.error && (
                          <p className="text-red-600 dark:text-red-400 mt-1">{tr.error}</p>
                        )}
                      </div>
                    ))}
                </div>
              ))}
              {streaming && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm bg-muted text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t p-3 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask HELIX to do something..."
                disabled={streaming}
                className="h-9 text-sm"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || streaming}
                className="h-9 w-9 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </>
  );
}
