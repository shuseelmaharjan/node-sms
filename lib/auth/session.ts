// lib/auth/session.ts
import { toast } from "sonner";
import { authApi } from "./api";
import { useAuthStore } from "./store";

let bootstrapping = false;

export async function bootstrapSession() {
  if (bootstrapping) return;
  bootstrapping = true;

  const store = useAuthStore.getState();

  try {
    // If already ready, don't re-bootstrap
    if (store.accessToken && store.user && store.sessionValid) return;

    // 1) Refresh (requires httpOnly refresh cookie)
    const refreshRes = await authApi.refresh();
    if (!refreshRes?.accessToken) {
      store.clear();
      return;
    }

    store.setAccessToken(refreshRes.accessToken);
    store.setSessionValid(true);

    // 2) Fetch user
    const me = await authApi.me();
    if (me?.user) {
      store.setUser(me.user);
      store.setSessionValid(true);

      // Optional: backend sometimes returns new accessToken in /me
      if (me.accessToken) store.setAccessToken(me.accessToken);
    } else {
      store.clear();
    }
  } catch {
    store.clear();
  } finally {
    store.setHydrated(true);
    bootstrapping = false;
  }
}

export async function login(identifier: string, password: string) {
  const data = await authApi.login(identifier, password);

  const store = useAuthStore.getState();
  store.setAccessToken(data.accessToken);
  store.setUser(data.user);
  store.setSessionValid(true);
  store.setHydrated(true);

  toast.success(data.message || "Signed in successfully");
  return data;
}

export async function logout() {
  const store = useAuthStore.getState();

  try {
    await authApi.logout();
  } catch {
    // ignore - still clear locally
  } finally {
    store.clear();
    toast.success("Signed out successfully");
  }
}