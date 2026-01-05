import axios from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

type FormErrorOptions<T extends FieldValues> = {
  setError?: UseFormSetError<T>;
  toast?: (message: string) => void;
};

export function handleFormError<T extends FieldValues>(
  error: unknown,
  options?: FormErrorOptions<T>
) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as any;

    // DRF / validation style: { errors: { field: ["msg"] } } or { field: ["msg"] }
    const fieldBag = data?.errors && typeof data.errors === "object" ? data.errors : data;

    if (status === 400 && fieldBag && typeof fieldBag === "object" && options?.setError) {
      let didSetAny = false;

      for (const [field, v] of Object.entries(fieldBag)) {
        if (field === "detail" || field === "message") continue;

        const msg = Array.isArray(v) ? String(v[0]) : String(v);

        // only set known fields; otherwise put on root error
        if (field === "email" || field === "password") {
          options.setError(field as Path<T>, { message: msg });
          didSetAny = true;
        }
      }

      if (didSetAny) return;
    }

    // fallback messages
    options?.toast?.(data?.detail || data?.message || "Something went wrong");
    return;
  }

  options?.toast?.("Unexpected error occurred");
}
