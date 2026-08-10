"use client";

import { useEffect, useState } from "react";

import { getMyProfile } from "@/lib/api/profile";
import type { Role } from "@/types";

export function useAuth() {
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMyProfile()
      .then((profile) => {
        if (!active) return;
        setRole(profile.role as Role);
        setCurrentUserId(profile.id);
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  return { role, currentUserId, isLoading };
}
