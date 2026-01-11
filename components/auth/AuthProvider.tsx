"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { bootstrapSession } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  const { hydrated, isInitialized } = useAuthStore();
  
  // Initialize auth state only once
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      if (!isInitialized && mounted) {
        console.log('AuthProvider: Initializing auth...');
        await bootstrapSession();
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [isInitialized]);

  // Show loading only during initial setup
  if (!hydrated || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
