import type {
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";

type ApiErrorLike = {
  message?: string;
  response?: { data?: unknown };
};

function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length) return String(value[0]);
  return null;
}

export function applyManagementApiErrors<T extends FieldValues>(
  error: unknown,
  methods: UseFormReturn<T>,
  options?: { fieldPrefix?: string }
): string {
  const apiError =
    error && typeof error === "object" ? (error as ApiErrorLike) : null;
  const data = apiError?.response?.data;

  if (!data || typeof data !== "object") {
    return (
      apiError?.message ||
      (error instanceof Error ? error.message : "Request failed")
    );
  }

  const record = data as Record<string, unknown>;
  let firstFieldMessage: string | null = null;

  for (const [key, value] of Object.entries(record)) {
    const message = firstMessage(value);
    if (!message) continue;

    if (key === "detail" || key === "message" || key === "non_field_errors") {
      firstFieldMessage ??= message;
      continue;
    }

    const path = options?.fieldPrefix
      ? `${options.fieldPrefix}.${key}`
      : key;

    methods.setError(path as FieldPath<T>, {
      type: "server",
      message,
    });

    firstFieldMessage ??= message;
  }

  return (
    firstMessage(record.detail) ||
    firstMessage(record.message) ||
    firstMessage(record.non_field_errors) ||
    firstFieldMessage ||
    apiError?.message ||
    "Request failed"
  );
}
