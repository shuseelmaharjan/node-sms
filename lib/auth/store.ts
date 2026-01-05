import { create } from "zustand";

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
  accessToken: string | null;
  user: User | null;
  hydrated: boolean; // NEW: “bootstrap finished”
  setHydrated: (v: boolean) => void;

  setAccessToken: (t: string | null) => void;
  setUser: (u: User | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,

  setHydrated: (v) => set({ hydrated: v }),
  setAccessToken: (t) => set({ accessToken: t }),
  setUser: (u) => set({ user: u }),
  clear: () => set({ accessToken: null, user: null, hydrated: true }),
}));
