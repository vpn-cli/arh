/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";

export function useRateLimitTimer(errors: any[] = []) {
  const [rateLimitTimer, setRateLimitTimer] = useState<number | null>(null);

  useEffect(() => {
    if (rateLimitTimer !== null) return;
    for (const err of errors) {
      const apiErr = err as any;
      if (apiErr?.status === 429 && apiErr?.retryAfter) {
        setRateLimitTimer(apiErr.retryAfter);
        break;
      }
    }
  }, [errors, rateLimitTimer]);

  useEffect(() => {
    if (rateLimitTimer === null || rateLimitTimer <= 0) return;
    const interval = setInterval(() => {
      setRateLimitTimer((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitTimer]);

  return rateLimitTimer;
}
