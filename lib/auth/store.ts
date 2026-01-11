import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  id: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
  is_superuser: boolean;
};

type AuthState = {
  accessToken: string | null; // In-memory only for security
  user: User | null; // Persisted for UX
  hydrated: boolean;
  isInitialized: boolean;
  sessionValid: boolean; // Track if we have a valid session
  
  setHydrated: (v: boolean) => void;
  setInitialized: (v: boolean) => void;
  setAccessToken: (t: string | null) => void;
  setUser: (u: User | null) => void;
  setSessionValid: (v: boolean) => void;
  clear: () => void;
  initialize: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null, // Never persisted - security
      user: null,
      hydrated: false,
      isInitialized: false,
      sessionValid: false,

      setHydrated: (v) => set({ hydrated: v }),
      setInitialized: (v) => set({ isInitialized: v }),
      setAccessToken: (t) => {
        set({ accessToken: t, sessionValid: Boolean(t) });
      },
      setUser: (u) => set({ user: u }),
      setSessionValid: (v) => set({ sessionValid: v }),
      
      clear: () => {
        set({ 
          accessToken: null, 
          user: null, 
          sessionValid: false,
          hydrated: true,
          isInitialized: true 
        });
      },
      
      initialize: () => {
        const state = get();
        if (!state.isInitialized) {
          set({ isInitialized: true, hydrated: true });
        }
      }
    }),
    {
      name: 'auth-session',
      // Only persist user data, not tokens (security best practice)
      partialize: (state) => ({ 
        user: state.user,
        // Note: accessToken is never persisted for security
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, we need to validate session
        if (state) {
          state.sessionValid = false; // Will be set to true after successful refresh
          state.hydrated = true;
        }
      },
    }
  )
);