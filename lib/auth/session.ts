// lib/auth/session.ts
import { toast } from "sonner";
import { authApi } from "./api";
import { useAuthStore } from "./store";

let isBootstrapping = false;

function isHtmlJsonParseError(err: any) {
  const msg = String(err?.message || "");
  return (
    msg.includes("Unexpected token <") ||
    msg.includes("Unexpected token '<'") ||
    err?.name === "SyntaxError"
  );
}

export async function bootstrapSession() {
  if (isBootstrapping) return;

  const store = useAuthStore.getState();

  if (store.isInitialized && store.sessionValid && store.accessToken && store.user) {
    store.setHydrated(true);
    return;
  }

  isBootstrapping = true;

  try {
    // 1) refresh
    let refreshRes: any;
    try {
      refreshRes = await authApi.refresh();
    } catch (err: any) {
      if (err?.message === "AUTH_HTML_RESPONSE" || isHtmlJsonParseError(err)) {
        console.log('Bootstrap: HTML response, clearing auth');
        store.clear();
        isBootstrapping = false;
        return;
      }
      throw err;
    }

    if (!refreshRes?.accessToken) {
      console.log('Bootstrap: No access token in refresh response');
      store.clear();
      isBootstrapping = false;
      return;
    }

    store.setAccessToken(refreshRes.accessToken);
    store.setSessionValid(true);

    // 2) me
    try {
      const meRes = await authApi.me();
      if (meRes?.user) {
        store.setUser(meRes.user);
      } else {
        console.log('Bootstrap: No user in me response');
        store.clear();
      }
    } catch (err: any) {
      if (err?.message === "AUTH_HTML_RESPONSE" || isHtmlJsonParseError(err)) {
        console.log('Bootstrap: HTML response from /me, clearing auth');
        store.clear();
        isBootstrapping = false;
        return;
      }
      console.log('Bootstrap: Error fetching user, clearing auth');
      store.clear();
    }
  } catch (error: any) {
    console.log('Bootstrap: Unexpected error', error);
    store.clear();

    if (typeof window !== "undefined") {
      const isLogin = window.location.pathname.startsWith("/login");
      const status = error?.response?.status;
      if (!isLogin && status && status !== 401) {
        toast.error("Session validation failed");
      }
    }
  } finally {
    store.setHydrated(true);
    store.setInitialized(true);
    isBootstrapping = false;
  }
}

export async function login(identifier: string, password: string) {
  try {
    const data = await authApi.login(identifier, password);

    if (!data?.accessToken || !data?.user) {
      throw new Error("Login failed: Invalid response from server");
    }

    const store = useAuthStore.getState();
    store.setAccessToken(data.accessToken);
    store.setUser(data.user);
    store.setSessionValid(true);

    store.setHydrated(true);
    store.setInitialized(true);

    toast.success(data.message || "Signed in successfully");
    return data;
  } catch (error: any) {
    if (error?.message === "LOGIN_FAILED") throw error;

    if (error?.message === "AUTH_HTML_RESPONSE" || isHtmlJsonParseError(error)) {
      toast.error("Login failed: server returned an unexpected response.");
      throw new Error("Login failed: unexpected server response");
    }

    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Login failed";

    toast.error(message);
    throw new Error(message);
  }
}

export async function logout(
  skipConfirmation: boolean = false,
  router?: { replace: (path: string) => void; refresh?: () => void },
  queryClient?: { clear: () => void }
) {
  if (!skipConfirmation) {
    const confirmed = confirm("Are you sure you want to sign out?");
    if (!confirmed) return;
  }

  const store = useAuthStore.getState();

  try {
    if (store.sessionValid) {
      try {
        await authApi.logout();
      } catch {
        // ignore server logout errors
      }
    }

    if (queryClient) queryClient.clear();

    store.clear();
    toast.success("Signed out successfully");
  } finally {
    store.clear();

    if (router) {
      router.replace("/login");
      router.refresh?.();
    } else if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}
