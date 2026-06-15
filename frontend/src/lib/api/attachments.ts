import type { Attachment } from "@/types";

import { api, request } from "@/lib/api";

export function getAttachments(ticketId: string): Promise<Attachment[]> {
  return request(api.get<Attachment[]>(`/tickets/${ticketId}/attachments`));
}

export function uploadAttachment(ticketId: string, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  return request(
    api.post<Attachment>(`/tickets/${ticketId}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );
}

export function deleteAttachment(ticketId: string, attachmentId: string): Promise<void> {
  return request(api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`));
}

export function getDownloadUrl(ticketId: string, attachmentId: string): string {
  return `/api/tickets/${ticketId}/attachments/${attachmentId}/download`;
}
