// lib/auth/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  id: string;
  name: string;
  phone?: string;
  email: string;
  role: string;
  status: string;
  profile_picture_file?: string | null;
};

type AuthState = {
  isInitialized: any;
  accessToken: string | null; // memory
  user: User | null;          // persisted
  hydrated: boolean;          // storage loaded
  bootstrapped: boolean;      // ✅ session check finished
  sessionValid: boolean;

  setAccessToken: (t: string | null) => void;
  setUser: (u: User | null) => void;
  setHydrated: (v: boolean) => void;
  setBootstrapped: (v: boolean) => void;
  setSessionValid: (v: boolean) => void;

  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isInitialized: false,
      accessToken: null,
      user: null,

      hydrated: false,
      bootstrapped: false, // ✅ start false
      sessionValid: false,

      setAccessToken: (t) => set({ accessToken: t }),
      setUser: (u) => set({ user: u }),
      setHydrated: (v) => set({ hydrated: v }),
      setBootstrapped: (v) => set({ bootstrapped: v }),
      setSessionValid: (v) => set({ sessionValid: v }),

      clear: () =>
        set({
          accessToken: null,
          user: null,
          sessionValid: false,
          bootstrapped: true, // ✅ bootstrap finished (failed)
          hydrated: true,
        }),
    }),
    {
      name: "auth-session",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
          // ✅ do NOT mark bootstrapped here
          // bootstrapSession will mark it after refresh/me completes
        }
      },
    }
  )
);
