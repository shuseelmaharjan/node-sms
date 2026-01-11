"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ConfirmationModalProvider } from "@/components/ui/confirmation-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConfirmationModalProvider>
        {children}
      </ConfirmationModalProvider>
    </AuthProvider>
  );
}
