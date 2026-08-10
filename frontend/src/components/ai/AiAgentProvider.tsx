"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  chatStream,
  confirmAiAction,
  getAiSessionActions,
  getAiSessionMessages,
  rejectAiAction,
} from "@/lib/api/ai-chat";
import type { AiAgentAction, AiMessage, AiToolResultDto, ConversationTurn } from "@/types/ai";

type AiAgentContextValue = {
  activeSessionId: string | null;
  turns: ConversationTurn[];
  streaming: boolean;
  selectSession: (sessionId: string) => Promise<void>;
  startNewSession: () => void;
  sendMessage: (message: string) => Promise<void>;
  confirmAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string) => Promise<void>;
};

const welcomeTurn = (): ConversationTurn => ({
  turnId: "welcome",
  userMessage: { content: "", createdAt: "" },
  assistantMessage: {
    content:
      "Hi! I'm HELIX, your IT helpdesk assistant. I can find information immediately and prepare platform actions for your confirmation.",
    toolResults: [],
    createdAt: new Date().toISOString(),
  },
});

const AiAgentContext = createContext<AiAgentContextValue | null>(null);

function parseToolResult(message: AiMessage): AiToolResultDto | null {
  if (!message.toolResultJson) return null;
  try {
    const parsed = JSON.parse(message.toolResultJson) as AiToolResultDto | unknown;
    if (typeof parsed === "object" && parsed !== null && "success" in parsed) {
      return parsed as AiToolResultDto;
    }
    return {
      toolCallId: message.toolCallId ?? message.id,
      name: message.toolName ?? "tool",
      success: true,
      result: parsed,
    };
  } catch {
    return null;
  }
}

function groupConversation(messages: AiMessage[], actions: AiAgentAction[]): ConversationTurn[] {
  const groups = new Map<string, AiMessage[]>();
  for (const message of messages) {
    const group = groups.get(message.turnId) ?? [];
    group.push(message);
    groups.set(message.turnId, group);
  }

  return Array.from(groups.entries()).flatMap(([turnId, group]) => {
    const userMessage = group.find((message) => message.role === "user");
    const assistantMessages = group.filter((message) => message.role === "assistant");
    const assistantMessage = assistantMessages.at(-1);
    if (!userMessage || !assistantMessage) return [];

    return [{
      turnId,
      userMessage: { content: userMessage.content, createdAt: userMessage.createdAt },
      assistantMessage: {
        content: assistantMessage.content,
        toolResults: group
          .filter((message) => message.role === "tool")
          .map(parseToolResult)
          .filter((result): result is AiToolResultDto => result !== null),
        createdAt: assistantMessage.createdAt,
      },
      action: actions.find((action) => action.turnId === turnId),
    } satisfies ConversationTurn];
  });
}

export function AiAgentProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([welcomeTurn()]);
  const [streaming, setStreaming] = useState(false);

  const updateTurn = useCallback((turnId: string, update: (turn: ConversationTurn) => ConversationTurn) => {
    setTurns((current) => current.map((turn) => turn.turnId === turnId ? update(turn) : turn));
  }, []);

  const selectSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setStreaming(true);
    try {
      const [messages, actions] = await Promise.all([
        getAiSessionMessages(sessionId),
        getAiSessionActions(sessionId),
      ]);
      setTurns(groupConversation(messages, actions));
    } catch {
      setTurns([]);
      toast.error("Could not load this HELIX conversation");
    } finally {
      setStreaming(false);
    }
  }, []);

  const startNewSession = useCallback(() => {
    setActiveSessionId(null);
    setTurns([welcomeTurn()]);
  }, []);

  const sendMessage = useCallback(async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || streaming) return;

    const localTurnId = crypto.randomUUID();
    setTurns((current) => [...current.filter((turn) => turn.turnId !== "welcome"), {
      turnId: localTurnId,
      userMessage: { content: message, createdAt: new Date().toISOString() },
      assistantMessage: { content: "", toolResults: [], createdAt: new Date().toISOString() },
    }]);
    setStreaming(true);
    let content = "";

    const sessionId = await chatStream(message, activeSessionId, {
      onText: (chunk) => {
        content += chunk;
        updateTurn(localTurnId, (turn) => ({
          ...turn,
          assistantMessage: { ...turn.assistantMessage, content },
        }));
      },
      onToolResult: (toolResult) => {
        updateTurn(localTurnId, (turn) => ({
          ...turn,
          assistantMessage: {
            ...turn.assistantMessage,
            toolResults: [...turn.assistantMessage.toolResults, toolResult],
          },
        }));
      },
      onActionRequired: (action) => {
        updateTurn(localTurnId, (turn) => ({
          ...turn,
          action,
          assistantMessage: {
            ...turn.assistantMessage,
            content: `Ready to ${action.summary}. Please confirm or cancel this action.`,
          },
        }));
      },
      onError: (error) => {
        updateTurn(localTurnId, (turn) => ({
          ...turn,
          assistantMessage: { ...turn.assistantMessage, content: `HELIX could not complete the request: ${error}` },
        }));
      },
      onDone: () => setStreaming(false),
    });

    if (sessionId) setActiveSessionId(sessionId);
    setStreaming(false);
    await queryClient.invalidateQueries({ queryKey: ["ai-sessions"] });
  }, [activeSessionId, queryClient, streaming, updateTurn]);

  const resolveAction = useCallback(async (actionId: string, confirm: boolean) => {
    const turn = turns.find((candidate) => candidate.action?.id === actionId);
    if (!turn?.action || turn.action.status !== "Pending") return;

    updateTurn(turn.turnId, (current) => ({
      ...current,
      action: current.action ? { ...current.action, status: "Executing" } : undefined,
    }));

    try {
      const action = confirm ? await confirmAiAction(actionId) : await rejectAiAction(actionId);
      updateTurn(turn.turnId, (current) => ({
        ...current,
        action,
        assistantMessage: {
          ...current.assistantMessage,
          content: action.status === "Succeeded"
            ? `Completed: ${action.summary}.`
            : action.status === "Rejected"
              ? `Cancelled: ${action.summary}.`
              : `HELIX could not ${action.summary}: ${action.error ?? "the action failed"}`,
          toolResults: action.result
            ? [...current.assistantMessage.toolResults.filter((result) => result.toolCallId !== action.result?.toolCallId), action.result]
            : current.assistantMessage.toolResults,
        },
      }));
      await queryClient.invalidateQueries();
    } catch (error) {
      updateTurn(turn.turnId, (current) => ({ ...current, action: turn.action }));
      toast.error(error instanceof Error ? error.message : "Could not update the HELIX action");
    }
  }, [queryClient, turns, updateTurn]);

  const value = useMemo<AiAgentContextValue>(() => ({
    activeSessionId,
    turns,
    streaming,
    selectSession,
    startNewSession,
    sendMessage,
    confirmAction: (actionId) => resolveAction(actionId, true),
    rejectAction: (actionId) => resolveAction(actionId, false),
  }), [activeSessionId, resolveAction, selectSession, sendMessage, startNewSession, streaming, turns]);

  return <AiAgentContext.Provider value={value}>{children}</AiAgentContext.Provider>;
}

export function useAiAgent() {
  const context = useContext(AiAgentContext);
  if (!context) throw new Error("useAiAgent must be used within AiAgentProvider");
  return context;
}
