import { api, request } from "@/lib/api";
import type { ScanAttachmentResponse, SuggestCategoryResponse, SuggestPriorityResponse, SuggestReplyResponse } from "@/types";
import { toast } from "sonner";

export function getAiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as { response?: { status?: number; data?: { message?: string; retryAfterSeconds?: number } } };
    if (axiosErr.response?.status === 429) {
      return axiosErr.response?.data?.message ?? "AI service is busy. Please wait a moment and try again.";
    }
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
  }
  return fallback;
}

export function handleAiError(err: unknown, fallback: string): void {
  toast.error(getAiErrorMessage(err, fallback));
}

export function suggestCategory(title: string, description: string): Promise<SuggestCategoryResponse> {
  return request(api.post<SuggestCategoryResponse>("/ai/suggest-category", { title, description }));
}

export function suggestPriority(title: string, description: string, categoryId: number): Promise<SuggestPriorityResponse> {
  return request(api.post<SuggestPriorityResponse>("/ai/suggest-priority", { title, description, categoryId }));
}

export function suggestReply(ticketId: string): Promise<SuggestReplyResponse> {
  return request(api.post<SuggestReplyResponse>("/ai/suggest-reply", { ticketId }));
}

export function scanAttachment(attachmentId: string): Promise<ScanAttachmentResponse> {
  return request(api.post<ScanAttachmentResponse>(`/ai/scan-attachment/${attachmentId}`));
}
