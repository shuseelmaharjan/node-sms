import axios from "axios";
import { ToastInterceptor } from "./toast-interceptor";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Enhanced API client with automatic toast notifications
 * Use this for general API calls that should show toasts
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "web",
  },
});

// Add response interceptor for success messages
apiClient.interceptors.response.use(
  (response) => ToastInterceptor.handleSuccess(response),
  (error) => ToastInterceptor.handleError(error)
);

/**
 * Silent API client without toast notifications
 * Use this for background operations or when you want manual error handling
 */
export const silentApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "web",
  },
});

// Add auth token to requests if available
const addAuthToken = (config: any) => {
  if (typeof window !== 'undefined') {
    // Get token from your auth store
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

apiClient.interceptors.request.use(addAuthToken);
silentApiClient.interceptors.request.use(addAuthToken);

export { ToastInterceptor };