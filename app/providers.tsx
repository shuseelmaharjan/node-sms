// app/providers.tsx
"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfirmationModalProvider } from "@/components/ui/confirmation-modal";
import { AuthBootstrap } from "@/lib/auth/AuthBootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 1000 * 60 * 5 },
          mutations: { retry: 0 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      <ConfirmationModalProvider>{children}</ConfirmationModalProvider>
    </QueryClientProvider>
  );
}
