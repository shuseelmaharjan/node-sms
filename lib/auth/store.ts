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
  accessToken: string | null; // memory
  user: User | null;          // persisted
  hydrated: boolean;
  sessionValid: boolean;

  setAccessToken: (t: string | null) => void;
  setUser: (u: User | null) => void;
  setHydrated: (v: boolean) => void;
  setSessionValid: (v: boolean) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hydrated: false,
      sessionValid: false,

      setAccessToken: (t) => set({ accessToken: t }),
      setUser: (u) => set({ user: u }),
      setHydrated: (v) => set({ hydrated: v }),
      setSessionValid: (v) => set({ sessionValid: v }),

      clear: () =>
        set({
          accessToken: null,
          user: null,
          sessionValid: false,
          hydrated: true,
        }),
    }),
    {
      name: "auth-session",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
