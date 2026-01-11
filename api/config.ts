/**
 * API Configuration
 * 
 * This directory contains all base API-related functionality:
 * 
 * - client.ts: Main axios client with auth interceptors
 * - enhanced-client.ts: API client with toast notifications
 * - errors.ts: Error handling utilities
 * - toast-interceptor.ts: Toast notification interceptors
 * - index.ts: Clean exports for easy importing
 * 
 * Usage:
 * ```ts
 * import { api, getApiErrorMessage } from "@/api";
 * import { apiClient } from "@/api"; // For toast notifications
 * ```
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  timeout: 10000,
  retryAttempts: 3,
} as const;