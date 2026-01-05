import axios from "axios";

export type ApiError = {
  status?: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export function toApiError(err: unknown): ApiError {
  if (!axios.isAxiosError(err)) return { message: "Something went wrong" };

  const status = err.response?.status;
  const data = err.response?.data as any;

  if (data?.detail) return { status, message: String(data.detail) };

  // DRF validation format: { field: ["msg"] }
  if (data && typeof data === "object") {
    const fieldErrors: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v)) fieldErrors[k] = v.map(String);
    }
    if (Object.keys(fieldErrors).length) {
      return { status, message: "Validation error", fieldErrors };
    }
  }

  return { status, message: err.message || "Request failed" };
}
