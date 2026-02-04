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
  transformResponse: [
    (data, headers) => {
      // If we got HTML when expecting JSON, throw a specific error
      if (typeof data === 'string' && data.trim().startsWith('<')) {
        console.error('API returned HTML instead of JSON. Check backend URL and routing.');
        throw new Error('AUTH_HTML_RESPONSE');
      }
      // Try to parse JSON
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data;
        }
      }
      return data;
    },
  ],
});

// IMPORTANT: make sure we do NOT have a forced JSON content-type on posts
delete api.defaults.headers.post["Content-Type"];

// Prevent multiple refresh attempts
let refreshPromise: Promise<string | null> | null = null;
let isRefreshing = false;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await api.post("/api/auth/refresh/");
      const { accessToken } = response.data as any;

      if (!accessToken) throw new Error("No accessToken in refresh response");

      const store = useAuthStore.getState();
      store.setAccessToken(accessToken);
      store.setSessionValid(true);

      // If user not present, fetch it once (helps auth guard + UI)
      if (!store.user) {
        try {
          const me = await api.get("/api/auth/me/");
          if ((me.data as any)?.user) store.setUser((me.data as any).user);
        } catch {
          // ignore; token is still set
        }
      }

      return accessToken;
    } catch (error) {
      // Do NOT navigate here (no window.location)
      useAuthStore.getState().clear();
      return null;
    } finally {
      refreshPromise = null;
      isRefreshing = false;
    }
  })();

  return refreshPromise;
}


// Add auth token + fix multipart uploads (Axios v1-safe)
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

    // Do NOT set multipart/form-data manually; browser will add boundary
    // Do NOT force transformRequest; axios will send FormData correctly now
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
    // Check if this is an HTML response error
    if (error.message === 'AUTH_HTML_RESPONSE') {
      const store = useAuthStore.getState();
      store.clear();
      
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        toast.error('Connection Error', { 
          description: 'Unable to reach the server. Please check your connection.' 
        });
      }
      
      return Promise.reject(error);
    }
    
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
