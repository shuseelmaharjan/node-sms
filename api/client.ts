// src/api/client.ts
import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/auth/store";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
  withCredentials: true, // ✅ required for httpOnly refresh cookie
  headers: { "X-Client-Type": "web" },
});

// Prevent forcing JSON content-type on FormData
delete api.defaults.headers.post["Content-Type"];

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await api.post("/api/auth/refresh/");
      const accessToken = (res.data as any)?.accessToken;
      if (!accessToken) return null;

      const store = useAuthStore.getState();
      store.setAccessToken(accessToken);
      store.setSessionValid(true);
      return accessToken;
    } catch {
      useAuthStore.getState().clear();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Request: attach token + handle FormData
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;
  if (isFormData) {
    if (config.headers instanceof AxiosHeaders) {
      config.headers.delete("Content-Type");
      config.headers.delete("content-type");
    } else {
      delete (config.headers as any)["Content-Type"];
      delete (config.headers as any)["content-type"];
    }
  }

  return config;
});

// Response: refresh on 401 (except auth endpoints)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const url = originalRequest?.url || "";
    const isAuthEndpoint = url.includes("/api/auth/");

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    // Toast errors for non-auth routes
    if (!isAuthEndpoint) {
      const msg = extractDjangoError(error);
      const status = error.response?.status;
      if (status && status >= 500) toast.error("Server Error", { description: msg });
      else toast.error(msg);
    }

    return Promise.reject(error);
  }
);
