// lib/handleFormError.ts
import axios from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

type FormErrorOptions<T extends FieldValues> = {
  setError?: UseFormSetError<T>;
  toast?: (message: string) => void;
};

function asFieldBag(data: any) {
  // DRF patterns:
  // { field: ["msg"] } OR { errors: { field: ["msg"] } }
  if (data?.errors && typeof data.errors === "object") return data.errors;
  if (data && typeof data === "object") return data;
  return null;
}

/**
 * Recursively process nested field errors from Django
 * e.g., { school: { phone: ["error"] } } -> "school.phone"
 */
function processNestedErrors<T extends FieldValues>(
  obj: any,
  setError: UseFormSetError<T>,
  prefix: string = ""
): boolean {
  let didSetAny = false;

  for (const [key, value] of Object.entries(obj)) {
    // Skip special keys
    if (key === "detail" || key === "message") continue;

    const fieldPath = prefix ? `${prefix}.${key}` : key;

    // Handle non_field_errors specially
    if (key === "non_field_errors" && Array.isArray(value) && value.length) {
      const rootPath = prefix || "root";
      setError(rootPath as Path<T>, { message: String(value[0]) });
      didSetAny = true;
      continue;
    }

    // If value is an array, it's a field error
    if (Array.isArray(value) && value.length) {
      const msg = String(value[0]);
      setError(fieldPath as Path<T>, { message: msg });
      didSetAny = true;
    }
    // If value is an object, recurse into it
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = processNestedErrors(value, setError, fieldPath);
      didSetAny = didSetAny || nested;
    }
  }

  return didSetAny;
}

export function handleFormError<T extends FieldValues>(
  error: unknown,
  options?: FormErrorOptions<T>
) {
  if (!axios.isAxiosError(error)) {
    options?.toast?.("Unexpected error occurred");
    return;
  }

  const status = error.response?.status;
  const data = error.response?.data as any;

  const fieldBag = asFieldBag(data);

  // Try field-level mapping for 400/422
  if ((status === 400 || status === 422) && fieldBag && options?.setError) {
    const didSetAny = processNestedErrors(fieldBag, options.setError);

    if (didSetAny) {
      // Don't show toast here - ToastInterceptor already handles it
      // Field errors are now displayed under each field
      return;
    }
  }

  // fallback toast - only for non-field errors
  // (ToastInterceptor handles most cases, this is backup)
  if (data?.detail || data?.message) {
    // Skip toast if interceptor already handled it
    return;
  }
  
  options?.toast?.("Something went wrong");
}
