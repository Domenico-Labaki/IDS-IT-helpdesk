import { api, request } from "@/lib/api";
import type { AiAgentAction, AiMessage, AiSession, AiSessionEvent, AiToolCallDto, AiToolResultDto } from "@/types/ai";

export type ChatStreamCallbacks = {
  onText?: (text: string) => void;
  onToolCall?: (toolCall: AiToolCallDto) => void;
  onToolResult?: (toolResult: AiToolResultDto) => void;
  onActionRequired?: (action: AiAgentAction) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
};

export async function chatStream(
  message: string,
  sessionId?: string | null,
  callbacks?: ChatStreamCallbacks,
  pagePath?: string,
): Promise<string | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055/api";

  try {
    const requestOptions: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        message,
        sessionId: sessionId || null,
        pagePath: pagePath || null,
      }),
    };
    let response = await fetch(`${apiUrl}/ai/chat`, requestOptions);
    if (response.status === 401) {
      await api.post("/auth/refresh");
      response = await fetch(`${apiUrl}/ai/chat`, requestOptions);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      callbacks?.onError?.(`Failed to connect: ${response.status} ${errorBody}`);
      return null;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sessionIdValue: string | null = sessionId ?? null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          callbacks?.onDone?.();
          return sessionIdValue;
        }

        try {
          const parsed = JSON.parse(data) as { type: string; content?: string; toolCall?: AiToolCallDto; toolResult?: AiToolResultDto; action?: AiAgentAction; session?: AiSessionEvent };

          switch (parsed.type) {
            case "session_created":
              if (parsed.session?.sessionId) sessionIdValue = parsed.session.sessionId;
              break;
            case "text":
              callbacks?.onText?.(parsed.content ?? "");
              break;
            case "tool_call":
              if (parsed.toolCall) callbacks?.onToolCall?.(parsed.toolCall);
              break;
            case "tool_result":
              if (parsed.toolResult) callbacks?.onToolResult?.(parsed.toolResult);
              break;
            case "action_required":
              if (parsed.action) callbacks?.onActionRequired?.(parsed.action);
              break;
          }
        } catch {
          callbacks?.onText?.(data);
        }
      }
    }

    callbacks?.onDone?.();
    return sessionIdValue;
  } catch (err) {
    callbacks?.onError?.(err instanceof Error ? err.message : "Connection failed");
    return null;
  }
}

// Session API
export function getAiSessions(): Promise<AiSession[]> {
  return request(api.get<AiSession[]>("/ai/sessions"));
}

export function createAiSession(title: string): Promise<AiSession> {
  return request(api.post<AiSession>("/ai/sessions", { title }));
}

export function updateAiSession(sessionId: string, title: string): Promise<AiSession> {
  return request(api.put<AiSession>(`/ai/sessions/${sessionId}`, { title }));
}

export function deleteAiSession(sessionId: string): Promise<void> {
  return request(api.delete(`/ai/sessions/${sessionId}`));
}

export function getAiSessionMessages(sessionId: string): Promise<AiMessage[]> {
  return request(api.get<AiMessage[]>(`/ai/sessions/${sessionId}/messages`));
}

export function getAiSessionActions(sessionId: string): Promise<AiAgentAction[]> {
  return request(api.get<AiAgentAction[]>(`/ai/sessions/${sessionId}/actions`));
}

export function confirmAiAction(actionId: string): Promise<AiAgentAction> {
  return request(api.post<AiAgentAction>(`/ai/actions/${actionId}/confirm`));
}

export function rejectAiAction(actionId: string): Promise<AiAgentAction> {
  return request(api.post<AiAgentAction>(`/ai/actions/${actionId}/reject`));
}
