export type AiToolCallDto = {
  id: string;
  name: string;
  arguments?: Record<string, unknown> | null;
};

export type AiToolResultDto = {
  toolCallId: string;
  name: string;
  success: boolean;
  result?: unknown;
  target?: AiActionTarget | null;
  targets?: AiActionTarget[];
  error?: string | null;
};

export type AiActionTarget = {
  kind: "ticket" | "comment" | "platform";
  label: string;
  href: string;
  ticketId?: string | null;
  commentId?: string | null;
  title?: string | null;
  subtitle?: string | null;
};

export type AiAgentAction = {
  id: string;
  sessionId: string;
  turnId: string;
  toolName: string;
  summary: string;
  status: "Pending" | "Executing" | "Succeeded" | "Failed" | "Rejected" | "Expired";
  result?: AiToolResultDto | null;
  target?: AiActionTarget | null;
  error?: string | null;
  createdAt: string;
  expiresAt: string;
  executedAt?: string | null;
};

export type AiSessionEvent = {
  sessionId: string;
};

export type AiTextEvent = { type: "text"; content: string };
export type AiSessionCreatedEvent = { type: "session_created"; session: AiSessionEvent };
export type AiToolCallEvent = { type: "tool_call"; toolCall: AiToolCallDto };
export type AiToolResultEvent = { type: "tool_result"; toolResult: AiToolResultDto };
export type AiActionRequiredEvent = { type: "action_required"; action: AiAgentAction };
export type AiStreamEvent = AiTextEvent | AiSessionCreatedEvent | AiToolCallEvent | AiToolResultEvent | AiActionRequiredEvent;

export type AiSession = {
  id: string;
  userId: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AiMessage = {
  id: string;
  sessionId: string;
  turnId: string;
  role: string;
  content: string;
  toolCallsJson?: string | null;
  toolCallId?: string | null;
  toolName?: string | null;
  toolResultJson?: string | null;
  createdAt: string;
};

export type ConversationTurn = {
  turnId: string;
  userMessage: { content: string; createdAt: string };
  assistantMessage: { content: string; toolResults: AiToolResultDto[]; createdAt: string };
  action?: AiAgentAction;
};
