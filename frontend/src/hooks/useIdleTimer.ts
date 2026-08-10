"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSettings } from "@/lib/api/settings";
import { logout as logoutRequest } from "@/lib/api/auth";

export function useIdleTimer() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnedRef = useRef(false);

  const { data: settings } = useQuery({
    queryKey: ["session-settings"],
    queryFn: getSettings,
    staleTime: 120000,
  });

  const enabled = settings?.sessionTimeoutEnabled === "true";
  const durationMinutes = Number(settings?.sessionDurationMinutes ?? 30);
  const timeoutMs = durationMinutes * 60 * 1000;
  const warnMs = Math.max(timeoutMs - 60000, 10000);

  const logout = useCallback(async () => {
    try { await logoutRequest(); } finally { router.push("/login"); }
  }, [router]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    warnedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      toast.warning("Session expiring soon due to inactivity.", {
        duration: 10000,
      });
      warnedRef.current = true;
      timerRef.current = setTimeout(logout, 60000);
    }, warnMs);
  }, [enabled, warnMs, logout]);

  useEffect(() => {
    if (!enabled) return;
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    for (const ev of events) {
      window.addEventListener(ev, resetTimer, { passive: true });
    }
    resetTimer();
    return () => {
      for (const ev of events) {
        window.removeEventListener(ev, resetTimer);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, resetTimer]);
}
