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
    // If already bootstrapped + valid, skip
    if (store.bootstrapped && store.accessToken && store.user && store.sessionValid) return;

    // Mark: bootstrapping started (not finished yet)
    store.setBootstrapped(false);

    // 1) Refresh (httpOnly cookie required)
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

      if (me.accessToken) store.setAccessToken(me.accessToken);
    } else {
      store.clear();
      return;
    }
  } catch {
    store.clear();
  } finally {
    // ✅ session check completed (success OR fail)
    useAuthStore.getState().setBootstrapped(true);
    useAuthStore.getState().setHydrated(true);
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
  store.setBootstrapped(true); // ✅ after login, session is ready

  toast.success(data.message || "Signed in successfully");
  return data;
}

export async function logout() {
  const store = useAuthStore.getState();

  try {
    await authApi.logout();
  } catch {
    // ignore
  } finally {
    store.clear();
    toast.success("Signed out successfully");
  }
}
