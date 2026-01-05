import { apiPublic } from "@/api/client";
import { useAuthStore } from "@/stores/useAuthStore";

export type User = {
  id: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
  is_superuser: boolean;
};

export async function login(identifier: string, password: string) {
  const res = await apiPublic.post("/api/auth/login/", { identifier, password });
  const { accessToken, user } = res.data as { accessToken: string; user: User };

  useAuthStore.getState().setAccessToken(accessToken);
  useAuthStore.getState().setUser(user);

  return { accessToken, user };
}

export async function logout() {
  try {
    await apiPublic.post("/api/auth/logout/", null);
  } finally {
    useAuthStore.getState().clear();
  }
}

/**
 * Bootstraps auth state using /me
 * - If refresh cookie exists and session is active, backend returns accessToken + user
 * - If 401, user stays logged out
 */
export async function bootstrapMe() {
  const res = await apiPublic.get("/api/auth/me/");
  const data = res.data as {
    user: User;
    session: { active: boolean; serverTime: string };
    accessToken?: string;
  };

  if (data.accessToken) useAuthStore.getState().setAccessToken(data.accessToken);
  useAuthStore.getState().setUser(data.user);
  useAuthStore.getState().setSessionActive(Boolean(data.session?.active));

  return data;
}
