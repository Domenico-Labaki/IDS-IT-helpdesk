import { api, request } from "@/lib/api";
import type { AiMessage, AiSession, AiSessionEvent, AiToolCallDto, AiToolResultDto } from "@/types/ai";

export type ChatStreamCallbacks = {
  onText?: (text: string) => void;
  onToolCall?: (toolCall: AiToolCallDto) => void;
  onToolResult?: (toolResult: AiToolResultDto) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
};

export async function chatStream(
  message: string,
  sessionId?: string | null,
  history?: { role: string; content: string }[],
  callbacks?: ChatStreamCallbacks,
): Promise<string | null> {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    callbacks?.onError?.("Not authenticated");
    return null;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055/api";

  try {
    const response = await fetch(`${apiUrl}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        sessionId: sessionId || null,
        history: history ?? [],
      }),
    });

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
          const parsed = JSON.parse(data) as { type: string; content?: string; toolCall?: AiToolCallDto; toolResult?: AiToolResultDto; session?: AiSessionEvent };

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
