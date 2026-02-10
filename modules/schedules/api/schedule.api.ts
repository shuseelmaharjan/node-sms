import { api } from "@/api";
import type {
  Paginated,
  Batch,
  AcademicClass,
  Section,
  Subject,
  TeacherListRow,
  Schedule,
  ScheduleCreatePayload,
  ScheduleUpdatePayload,
} from "../types/schedule.types";

const SCHEDULES = "/api/v1/academics/schedules/";
const BATCHES = "/api/v1/batches/";
const CLASSES = "/api/v1/academics/classrooms/";
const SECTIONS = "/api/v1/academics/sections/";
const SUBJECTS = "/api/v1/subjects/";
const TEACHERS = "/api/v1/teachers/";

export type ScheduleListParams = {
  page?: number;        // DRF pagination is usually 1-based
  page_size?: number;
  search?: string;
  ordering?: string;

  batch?: string | number;
  academic_class?: string;
  section?: string;
  teacher?: string;
  day_of_week?: string | number;
};

export async function listSchedules(params: ScheduleListParams) {
  const res = await api.get<Paginated<Schedule>>(SCHEDULES, { params });
  return res.data;
}

export async function createSchedule(payload: ScheduleCreatePayload) {
  const res = await api.post<{ message: string; data: Schedule }>(SCHEDULES, payload);
  return res.data.data;
}

export async function updateSchedule(id: string, payload: ScheduleUpdatePayload) {
  const res = await api.patch<{ message: string; data: Schedule }>(`${SCHEDULES}${id}/`, payload);
  return res.data.data;
}

export async function deleteSchedule(id: string) {
  await api.delete(`${SCHEDULES}${id}/`);
}

/* Lookups */
export async function listBatches(params?: { page?: number; page_size?: number }) {
  const res = await api.get<Paginated<Batch>>(BATCHES, { params });
  return res.data;
}

export async function listClasses(params?: { page?: number; page_size?: number; batch?: number | string }) {
  const res = await api.get<Paginated<AcademicClass>>(CLASSES, { params });
  return res.data;
}

export async function listSections(params?: { page?: number; page_size?: number; academic_class?: string; batch?: number | string }) {
  const res = await api.get<Paginated<Section>>(SECTIONS, { params });
  return res.data;
}

export async function listSubjects(params?: { page?: number; page_size?: number; search?: string }) {
  const res = await api.get<Paginated<Subject>>(SUBJECTS, { params });
  return res.data;
}

export async function listTeachers(params?: { page?: number; page_size?: number; search?: string; ordering?: string }) {
  const res = await api.get<Paginated<TeacherListRow>>(TEACHERS, { params });
  return res.data;
}
