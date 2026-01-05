"use client";

import { useEffect, useState } from "react";
import { toApiError, type ApiError } from "@/api/apiHandler";

export function useApiQuery<TData>(key: string, fn: () => Promise<TData>) {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fn()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(toApiError(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [key]);

  return { data, error, loading };
}
