// lib/http/error.ts (or inline in login page)
import axios from "axios";

export function getApiErrorMessage(err: unknown) {
  if (!axios.isAxiosError(err)) return "Something went wrong";

  const data: any = err.response?.data;

  if (!data) return err.message || "Request failed";

  if (typeof data === "string") return data;

  if (data.non_field_errors?.length) return String(data.non_field_errors[0]);
  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);

  // fallback: first field error
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v) && v.length) return `${k}: ${v[0]}`;
  }

  return "Request failed";
}
