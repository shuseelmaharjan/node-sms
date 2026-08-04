import axios from "axios";
import type {
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";

type ApiErrorBody = {
  detail?: unknown;
  message?: unknown;
  non_field_errors?: unknown;
  [key: string]: unknown;
};

function firstMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;

  if (Array.isArray(value)) {
    const first = value.find(
      (item) => typeof item === "string" && item.trim()
    );
    return typeof first === "string" ? first : null;
  }

  return null;
}

export function getApiErrorBody(error: unknown): ApiErrorBody | null {
  if (!axios.isAxiosError(error)) return null;

  const data = error.response?.data;
  return data && typeof data === "object" ? (data as ApiErrorBody) : null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string
): string {
  const body = getApiErrorBody(error);

  const fieldMessage = body
    ? Object.entries(body)
        .filter(([key]) =>
          !["detail", "message", "non_field_errors"].includes(key)
        )
        .map(([, value]) => firstMessage(value))
        .find(Boolean)
    : null;

  return (
    firstMessage(body?.detail) ??
    firstMessage(body?.message) ??
    firstMessage(body?.non_field_errors) ??
    fieldMessage ??
    (axios.isAxiosError(error) ? error.message : null) ??
    fallback
  );
}

export function applyApiFieldErrors<TValues extends FieldValues>(
  error: unknown,
  methods: UseFormReturn<TValues>,
  fields: readonly FieldPath<TValues>[]
): boolean {
  const body = getApiErrorBody(error);
  if (!body) return false;

  let applied = false;

  for (const field of fields) {
    const message = firstMessage(body[field]);
    if (!message) continue;

    methods.setError(field, {
      type: "server",
      message,
    });
    applied = true;
  }

  return applied;
}
