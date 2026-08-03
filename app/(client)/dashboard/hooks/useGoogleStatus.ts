"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchGoogleStatus } from "../services/dashboard.service";

export interface UseGoogleStatusReturn {
  connected: boolean | null;
  dismissed: boolean;
  dismiss: () => void;
}

/**
 * Checks whether the user's Google account is connected and manages
 * the dismissal state of the warning banner.
 */
export function useGoogleStatus(): UseGoogleStatusReturn {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkStatus = useCallback(async () => {
    const data = await fetchGoogleStatus();
    setConnected(data?.connected ?? false);
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const dismiss = useCallback(() => setDismissed(true), []);

  return { connected, dismissed, dismiss };
}
