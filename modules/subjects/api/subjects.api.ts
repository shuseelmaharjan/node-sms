import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import type { SubjectEntity, SubjectStatus } from "../types/subject.types";

const BASE = "/api/v1/subjects/";
const DETAIL = (id: string) => `/api/v1/subjects/${id}/`;
const REORDER = "/api/v1/subjects/reorder/";
const TOGGLE_STATUS = (id: string) => `/api/v1/subjects/${id}/toggle-status/`;

export async function fetchSubjects(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  status?: SubjectStatus | "all";
  include_deleted?: boolean;
}) {
  const res = await api.get<PaginatedResponse<SubjectEntity>>(BASE, {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 200,
      search: params?.search || undefined,
      ordering: params?.ordering || undefined,
      status: params?.status && params.status !== "all" ? params.status : undefined,
      include_deleted: params?.include_deleted ? "true" : undefined,
    },
  });
  return res.data;
}

export async function createSubject(payload: {
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  sort_order: number;
}) {
  const res = await api.post(BASE, payload);
  return (res.data as any)?.data ?? res.data;
}

export async function updateSubject(
  id: string,
  payload: Partial<{
    name: string;
    code: string;
    description?: string;
    status: "active" | "inactive";
  }>
) {
  const res = await api.put(DETAIL(id), payload);
  return (res.data as any)?.data ?? res.data;
}

export async function deleteSubject(id: string) {
  await api.delete(DETAIL(id));
}

export async function reorderSubjects(items: Array<{ id: string; sort_order: number }>) {
  const res = await api.post(REORDER, { items });
  return res.data;
}

/** NEW: uses backend toggle endpoint */
export async function toggleSubjectStatus(id: string, status: "active" | "inactive") {
  const res = await api.post(TOGGLE_STATUS(id), { status });
  return (res.data as any)?.data ?? res.data;
}
