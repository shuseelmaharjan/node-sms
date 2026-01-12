// api/client.ts
import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/lib/auth/store";
import { toast } from "sonner";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Django error extraction utility
function extractDjangoError(error: any): string {
  const data = error.response?.data;

  if (!data) return error.message || "Request failed";
  if (typeof data === "string") return data;

  if (data.non_field_errors?.length) return data.non_field_errors[0];
  if (data.detail) return data.detail;
  if (data.message) return data.message;

  for (const [field, errors] of Object.entries(data)) {
    if (Array.isArray(errors) && errors.length > 0) {
      return `${field}: ${errors[0]}`;
    }
  }

  return error.message || "Request failed";
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "X-Client-Type": "web" },
});

// ✅ IMPORTANT: make sure we do NOT have a forced JSON content-type on posts
delete api.defaults.headers.post["Content-Type"];

// Prevent multiple refresh attempts
let refreshPromise: Promise<string | null> | null = null;
let isRefreshing = false;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  if (isRefreshing) {
    while (isRefreshing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return useAuthStore.getState().accessToken;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await api.post("/api/auth/refresh/");
      const { accessToken, user } = response.data as any;

      if (accessToken) {
        const store = useAuthStore.getState();
        store.setAccessToken(accessToken);
        store.setSessionValid(true);
        if (user) store.setUser(user);
        return accessToken;
      }

      throw new Error("No access token in refresh response");
    } catch (error) {
      console.warn("Token refresh failed:", error);
      useAuthStore.getState().clear();

      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login";
      }

      return null;
    } finally {
      refreshPromise = null;
      isRefreshing = false;
    }
  })();

  return refreshPromise;
}

// ✅ Add auth token + fix multipart uploads (Axios v1-safe)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    // Axios v1: config.headers may be AxiosHeaders
    if (config.headers instanceof AxiosHeaders) {
      config.headers.delete("Content-Type");
      config.headers.delete("content-type");
    } else {
      delete (config.headers as any)["Content-Type"];
      delete (config.headers as any)["content-type"];
    }

    // ✅ DO NOT set multipart/form-data manually; browser will add boundary
    // ✅ DO NOT force transformRequest; axios will send FormData correctly now
  }

  return config;
});

// Handle token refresh on 401 + toasts
api.interceptors.response.use(
  (response) => {
    const isAuthRoute = response.config?.url?.includes("/api/auth/");
    if (response.data?.message && !isAuthRoute) {
      toast.success(response.data.message);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const isAuthEndpoint = originalRequest?.url?.includes("/api/auth/");

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    if (!isAuthEndpoint) {
      const errorMessage = extractDjangoError(error);
      const status = error.response?.status;

      if (status && status >= 500) {
        toast.error("Server Error", { description: errorMessage });
      } else if (status && status >= 400) {
        toast.error(errorMessage);
      }
    }

    return Promise.reject(error);
  }
);
