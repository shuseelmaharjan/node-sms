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
    let didSetAny = false;

    for (const [field, v] of Object.entries(fieldBag)) {
      if (field === "detail" || field === "message" || field === "non_field_errors") continue;

      const msg = Array.isArray(v) ? String(v[0]) : String(v);
      options.setError(field as Path<T>, { message: msg });
      didSetAny = true;
    }

    // Non-field errors
    if (Array.isArray(fieldBag?.non_field_errors) && fieldBag.non_field_errors.length) {
      options.setError("root" as Path<T>, { message: String(fieldBag.non_field_errors[0]) });
      didSetAny = true;
    }

    if (didSetAny) return;
  }

  // fallback toast
  options?.toast?.(data?.detail || data?.message || "Something went wrong");
}
