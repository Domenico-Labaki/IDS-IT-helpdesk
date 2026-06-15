import type { UpdateProfilePayload, UserProfile } from "@/types";

import { api, request } from "@/lib/api";

export function getMyProfile(): Promise<UserProfile> {
  return request(api.get<UserProfile>("/profile"));
}

export function updateMyProfile(data: UpdateProfilePayload): Promise<UserProfile> {
  return request(api.put<UserProfile>("/profile", data));
}

export function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return request(
    api.post<{ avatarUrl: string }>("/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
}

export function deleteAvatar(): Promise<void> {
  return request(api.delete("/profile/avatar"));
}
