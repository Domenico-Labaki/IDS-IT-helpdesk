"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";

import { useAiAgent } from "@/components/ai/AiAgentProvider";
import { AiMessageBubble } from "@/components/ai/AiMessageBubble";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ChatAssistant() {
  const pathname = usePathname();
  const { turns, streaming, sendMessage, confirmAction, rejectAction } = useAiAgent();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, streaming, turns]);

  if (pathname === "/ai") return null;

  const submit = async () => {
    const message = input.trim();
    if (!message || streaming) return;
    setInput("");
    await sendMessage(message);
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
            <Button variant="ghost" size="icon-xs" onClick={() => setOpen(false)} aria-label="Close HELIX">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-80 overflow-y-auto p-4 space-y-3">
              {turns.slice(-8).map((turn) => (
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
            <div className="border-t p-3 flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                placeholder="Ask HELIX..."
                disabled={streaming}
                maxLength={4000}
                className="h-9 text-sm"
              />
              <Button
                size="icon"
                onClick={() => void submit()}
                disabled={!input.trim() || streaming}
                className="h-9 w-9 shrink-0"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
        size="icon"
        aria-label="Open HELIX assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </>
  );
}
