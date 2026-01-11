"use client";

import { useState } from "react";
import { type ApiError, getApiErrorMessage } from "@/api";

export function useApiMutation<TVars, TData>(
  fn: (vars: TVars) => Promise<TData>
) {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  async function mutate(vars: TVars) {
    setLoading(true);
    setError(null);
    try {
      const res = await fn(vars);
      setData(res);
      return res;
    } catch (e) {
      const err: ApiError = { message: getApiErrorMessage(e) };
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { mutate, data, error, loading };
}
