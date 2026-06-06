import type { UpdateProfilePayload, UserProfile } from "@/types";

import { api, request } from "@/lib/api";

export function getMyProfile(): Promise<UserProfile> {
  return request(api.get<UserProfile>("/profile"));
}

export function updateMyProfile(data: UpdateProfilePayload): Promise<UserProfile> {
  return request(api.put<UserProfile>("/profile", data));
}
