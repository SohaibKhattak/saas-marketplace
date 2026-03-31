"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function AuthInitializer() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const { user, accessToken, refreshToken } = useAuthStore.getState();
    // If we have a user persisted but no in-memory access token, restore via refresh
    if (user && !accessToken) {
      refreshToken();
    }
  }, []);

  return null;
}
