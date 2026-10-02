"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: Error & { status?: number }) => {
              if (error?.status === 403 || error?.status === 401 || error?.status === 429) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: false, // Prevent spamming API on tab focus
            staleTime: 60 * 1000, // 1 minute default stale time
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
