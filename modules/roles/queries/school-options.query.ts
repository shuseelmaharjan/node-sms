import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";

export type SchoolOption = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

type SchoolListItem = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

const SCHOOLS_URL = "/api/v1/org/schools/";

function toOption(x: SchoolListItem): SchoolOption {
  return {
    id: x.id,
    code: x.code,
    name: x.name,
    is_active: Boolean(x.is_active),
  };
}

/**
 * Fetch a list of schools for select dropdowns.
 * - optimized small payload via fields/page_size if backend supports it
 * - cached for a while because schools don't change often
 */
export function useSchoolOptionsQuery(args?: {
  includeInactive?: boolean; // if false, we still fetch all but caller can hide/disable
  pageSize?: number;
  enabled?: boolean;
}) {
  const pageSize = args?.pageSize ?? 200;
  const enabled = args?.enabled ?? true;

  return useQuery({
    queryKey: ["org-schools", "options", { pageSize }],
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 30 * 60 * 1000, // 30 min
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<SchoolListItem>>(SCHOOLS_URL, {
        params: {
          page: 1,
          page_size: pageSize,
          ordering: "name",
          // If your backend supports limiting fields, uncomment this:
          // fields: "id,code,name,is_active",
        },
      });

      // NOTE: this only fetches first page; if you can exceed 200 schools,
      // implement a small "fetch all pages" loop (I can provide).
      return (res.data?.results ?? []).map(toOption);
    },
  });
}
