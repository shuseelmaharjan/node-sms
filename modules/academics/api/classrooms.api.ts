import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import type { BatchEntity, ClassroomEntity, SectionEntity } from "../@types/classroom.types";

const BATCHES_URL = "/api/v1/batches/";
const CLASSROOMS_URL = "/api/v1/academics/classrooms/";
const CLASSROOM_DETAIL = (id: string) => `/api/v1/academics/classrooms/${id}/`;
const CLASSROOM_REORDER = "/api/v1/academics/classrooms/reorder/";

const SECTIONS_URL = "/api/v1/academics/sections/";
const SECTION_DETAIL = (id: string) => `/api/v1/academics/sections/${id}/`;
const SECTION_REORDER = "/api/v1/academics/sections/reorder/";

export async function fetchBatches(params: { status?: "active" | "inactive"; page?: number; page_size?: number; search?: string }) {
  const res = await api.get<PaginatedResponse<BatchEntity>>(BATCHES_URL, { params });
  return res.data;
}

export async function fetchClassrooms(params?: { batch_id?: number }) {
  // backend may or may not support filtering; we pass it anyway
  const res = await api.get<PaginatedResponse<ClassroomEntity>>(CLASSROOMS_URL, { params });
  return res.data;
}

export async function createClassroom(payload: {
  batch_id: number;
  name: string;
  is_active?: boolean;
  sort_order?: number;
}) {
  const res = await api.post(CLASSROOMS_URL, payload);
  return res.data;
}

export async function updateClassroom(id: string, payload: { name?: string; is_active?: boolean; sort_order?: number }) {
  const res = await api.patch(CLASSROOM_DETAIL(id), payload);
  return res.data;
}

export async function deleteClassroom(id: string) {
  await api.delete(CLASSROOM_DETAIL(id));
}

export async function reorderClassrooms(payload: { batch_id: number; ordered_ids: string[] }) {
  const res = await api.post(CLASSROOM_REORDER, payload);
  return res.data;
}

export async function fetchSections(params?: { academic_class_id?: string }) {
  const res = await api.get<PaginatedResponse<SectionEntity>>(SECTIONS_URL, { params });
  return res.data;
}

export async function createSection(payload: {
  academic_class_id: string;
  name: string;
  is_active?: boolean;
  sort_order?: number;
}) {
  const res = await api.post(SECTIONS_URL, payload);
  return res.data;
}

export async function updateSection(id: string, payload: { name?: string; is_active?: boolean; sort_order?: number }) {
  const res = await api.patch(SECTION_DETAIL(id), payload);
  return res.data;
}

export async function deleteSection(id: string) {
  await api.delete(SECTION_DETAIL(id));
}

export async function reorderSections(payload: { academic_class_id: string; ordered_ids: string[] }) {
  const res = await api.post(SECTION_REORDER, payload);
  return res.data;
}
