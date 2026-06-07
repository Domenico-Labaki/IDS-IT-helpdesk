"use client";

import { useEffect, useState } from "react";

import { decodeToken, getToken } from "@/lib/auth";
import type { Role } from "@/types";

export function useAuth() {
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setRole(decoded.role as Role);
        setCurrentUserId(decoded.userId);
      }
    }
    setIsLoading(false);
  }, []);

  return { role, currentUserId, isLoading };
}
