import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import type { CourseEntity } from "../types/course.types";

const COURSES_URL = "/api/v1/courses/";
const COURSE_DETAIL_URL = (id: string) => `/api/v1/courses/${id}/`;
const COURSE_REORDER_URL = "/api/v1/courses/reorder/";

type CourseApiPayload = {
  name: string;
  description: string;
  navigation_id: string;
  slug: string;
  image_id?: string | null;
  banner_id?: string | null;
  tags: string;
  is_popular?: boolean;
};

export async function fetchCourses(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}) {
  const res = await api.get<PaginatedResponse<CourseEntity>>(COURSES_URL, {
    params,
  });
  return res.data;
}

export async function fetchCourseById(id: string) {
  const res = await api.get<CourseEntity>(COURSE_DETAIL_URL(id));
  return res.data;
}

export async function createCourse(payload: CourseApiPayload) {
  const res = await api.post(COURSES_URL, payload);
  return res.data;
}

export async function updateCourse(id: string, payload: CourseApiPayload) {
  const res = await api.put(COURSE_DETAIL_URL(id), payload);
  return res.data;
}

export async function deleteCourse(id: string) {
  await api.delete(COURSE_DETAIL_URL(id));
}

export async function reorderCourses(payload: { ordered_ids: string[] }) {
  const res = await api.post(COURSE_REORDER_URL, payload);
  return res.data;
}