// lib/auth/session.ts
import { toast } from "sonner";
import { authApi } from "./api";
import { useAuthStore } from "./store";

/**
 * Prevent multiple bootstrap calls in parallel
 */
let isBootstrapping = false;

/**
 * Bootstraps auth state on app start (or after reload)
 * - tries /refresh (cookie-based)
 * - if success, sets access token and fetches /me
 * - if fail, clears auth state (guard will redirect to /login)
 */
export async function bootstrapSession() {
  if (isBootstrapping) return;

  const store = useAuthStore.getState();

  // If already initialized + session valid, skip
  if (store.isInitialized && store.sessionValid && store.accessToken && store.user) {
    store.setHydrated(true);
    return;
  }

  isBootstrapping = true;

  try {
    // Validate refresh cookie and obtain access token
    const refreshRes = await authApi.refresh();

    if (!refreshRes?.accessToken) {
      store.clear();
      return;
    }

    store.setAccessToken(refreshRes.accessToken);
    store.setSessionValid(true);

    // Fetch user data (required by your isAuthenticated condition)
    try {
      const meRes = await authApi.me();
      if (meRes?.user) {
        store.setUser(meRes.user);
      } else {
        // If user missing, treat as invalid auth state
        store.clear();
      }
    } catch (err) {
      // If /me fails, session is likely invalid or server denied
      store.clear();
    }
  } catch (error: any) {
    // No toast on boot usually (avoid noisy UX)
    store.clear();

    // Only show toast if user is not on login and it’s not a basic 401
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

/**
 * Login:
 * - calls /login
 * - stores accessToken + user in Zustand
 * - does NOT redirect here (UI/layout should redirect)
 */
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

    // Ensure app stops showing “initializing…”
    store.setHydrated(true);
    store.setInitialized(true);

    // Only show toast here if your authApi.login doesn’t already show it
    toast.success(data.message || "Signed in successfully");

    return data;
  } catch (error: any) {
    // authApi.login already shows toast & throws LOGIN_FAILED clean error
    if (error?.message === "LOGIN_FAILED") throw error;

    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Login failed";

    toast.error(message);
    throw new Error(message);
  }
}

/**
 * Logout:
 * - tries server logout (clears refresh cookie)
 * - clears React Query cache (optional)
 * - clears Zustand auth state
 * - navigates via router (no hard reload)
 */
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
    // Server logout (cookie revoke)
    if (store.sessionValid) {
      try {
        await authApi.logout();
      } catch {
        // ignore server logout errors; still clear local
      }
    }

    // Clear react-query cache (important)
    if (queryClient) {
      queryClient.clear();
    }

    // Clear local auth
    store.clear();

    toast.success("Signed out successfully");
  } finally {
    // Ensure fully cleared
    store.clear();

    // ✅ SPA navigation only — no reload
    if (router) {
      router.replace("/login");
      router.refresh?.();
    } else if (typeof window !== "undefined") {
      // fallback only
      window.location.href = "/login";
    }
  }
}
