import { authApi } from "./api";
import { useAuthStore } from "./store";
import { toast } from "sonner";

export async function bootstrapSession() {
  try {
    const data = await authApi.me();
    if (data.accessToken) useAuthStore.getState().setAccessToken(data.accessToken);
    useAuthStore.getState().setUser(data.user);
  } catch (error) {
    // If /me fails (e.g., no valid session), just clear auth state
    console.warn('Failed to bootstrap session:', error);
    useAuthStore.getState().clear();
  } finally {
    useAuthStore.getState().setHydrated(true);
  }
}

export async function login(identifier: string, password: string) {
  const data = await authApi.login(identifier, password);
  if (!data) {
    throw new Error('Login failed: no data returned');
  }
  
  useAuthStore.getState().setAccessToken(data.accessToken);
  useAuthStore.getState().setUser(data.user);
  useAuthStore.getState().setHydrated(true); // Ensure hydration is set
  
  // Show success toast if no message from server
  if (!data.message) {
    toast.success("Signed in successfully");
  }
  
  return data;
}

export async function logout() {
  try {
    await authApi.logout();
    toast.success("Signed out successfully");
  } finally {
    useAuthStore.getState().clear();
  }
}
