"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, ExternalLink, Loader2, Send, ShieldCheck, X } from "lucide-react";

import { useAiAgent } from "@/components/ai/AiAgentProvider";
import { AiMessageBubble } from "@/components/ai/AiMessageBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChatAssistant() {
  const pathname = usePathname();
  const { turns, streaming, sendMessage, confirmAction, rejectAction } = useAiAgent();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("helix:open", onOpen);
    return () => window.removeEventListener("helix:open", onOpen);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      window.setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open, streaming, turns]);

  if (pathname === "/ai") return null;

  const submit = async () => {
    const message = input.trim();
    if (!message || streaming) return;
    setInput("");
    await sendMessage(message);
  };

  return open ? (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-label="Close HELIX" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right duration-200" aria-label="HELIX assistant">
        <div className="relative overflow-hidden border-b border-border px-5 py-5">
          <div className="signal-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative flex items-start gap-3">
            <div className="helix-gradient flex size-10 shrink-0 items-center justify-center rounded-xl text-white">
              <Bot className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="section-label text-primary">Intelligence layer</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">HELIX copilot</h2>
              <p className="mt-1 text-xs text-muted-foreground">Context: {pathname === "/dashboard" ? "operations overview" : pathname.replaceAll("/", " ").trim()}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close HELIX"><X /></Button>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-5 py-6">
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

        <div className="border-t border-border bg-card p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
              placeholder="Ask HELIX or prepare an action..."
              disabled={streaming}
              maxLength={4000}
              className="h-11"
            />
            <Button size="icon" onClick={() => void submit()} disabled={!input.trim() || streaming} className="size-11">
              {streaming ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3" />Actions require confirmation</span>
            <Link href="/ai" className="flex items-center gap-1 font-semibold text-primary hover:underline">Open workspace <ExternalLink className="size-3" /></Link>
          </div>
        </div>
      </aside>
    </div>
  ) : null;
}
