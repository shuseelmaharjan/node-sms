"use client";

import { toast } from "sonner";
import { AxiosResponse, AxiosError } from "axios";

export interface ApiResponse {
  success?: boolean;
  message?: string;
  data?: any;
  non_field_errors?: string[];
  detail?: string;
}

/**
 * Centralized toast notification handler for API responses
 */
export class ToastInterceptor {
  /**
   * Handle successful API responses
   * Shows success toast if response contains a message
   */
  static handleSuccess(response: AxiosResponse<ApiResponse>) {
    const data = response.data;
    
    // Show success toast if message is provided
    if (data?.message) {
      toast.success(data.message);
    }
    
    return response;
  }

  /**
   * Handle API errors
   * Shows error toast based on error type and status
   */
  static handleError(error: AxiosError<ApiResponse>) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    let message: string;

    // Extract error message from various response formats
    if (data?.message) {
      message = data.message;
    } else if (data?.non_field_errors?.length) {
      message = data.non_field_errors[0];
    } else if (data?.detail) {
      message = data.detail;
    } else if (typeof data === 'string') {
      message = data;
    } else {
      // Default messages based on status code
      switch (status) {
        case 400:
          message = "Invalid request. Please check your input.";
          break;
        case 401:
          message = "Authentication required. Please log in.";
          break;
        case 403:
          message = "You don't have permission to perform this action.";
          break;
        case 404:
          message = "The requested resource was not found.";
          break;
        case 422:
          message = "Validation failed. Please check your input.";
          break;
        case 429:
          message = "Too many requests. Please try again later.";
          break;
        case 500:
          message = "Server error. Please try again later.";
          break;
        default:
          message = error.message || "Something went wrong. Please try again.";
      }
    }

    // Show appropriate toast based on status
    if (status === 401) {
      toast.error(message, {
        description: "Redirecting to login...",
      });
    } else if (status && status >= 500) {
      toast.error("Server Error", {
        description: message,
      });
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }

  /**
   * Handle API warnings (for custom warning responses)
   */
  static handleWarning(message: string, description?: string) {
    toast.warning(message, description ? { description } : undefined);
  }

  /**
   * Handle API info messages
   */
  static handleInfo(message: string, description?: string) {
    toast.info(message, description ? { description } : undefined);
  }
}

/**
 * Extract message from form submission responses
 * Useful for form components that need to show custom messages
 */
export function extractResponseMessage(
  response: AxiosResponse<ApiResponse>
): string | null {
  return response.data?.message || null;
}

/**
 * Extract error message from API errors
 * Useful for form components that need custom error handling
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return "An unexpected error occurred.";
}