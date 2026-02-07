// api/index.ts
// Main API client (centralized with auth)
export { api } from "./client";

// Enhanced API clients with toast handling
export { apiClient, silentApiClient } from "./enhanced-client";

// Error handling utilities
export { getApiErrorMessage } from "./errors";

// Toast interceptor for custom implementations
export { ToastInterceptor } from "./toast-interceptor";

// Types
export type { ApiError } from "./errors";
