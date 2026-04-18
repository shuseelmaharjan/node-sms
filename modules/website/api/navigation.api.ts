import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import type { NavigationEntity } from "../types/navigation.types";

const NAVIGATIONS_URL = "/api/v1/navigations/";
const NAVIGATION_DETAIL = (id: string) => `/api/v1/navigations/${id}/`;
const NAVIGATION_REORDER = "/api/v1/navigations/reorder/";

export async function fetchNavigations() {
  const res = await api.get<PaginatedResponse<NavigationEntity>>(NAVIGATIONS_URL);
  return res.data;
}

export async function fetchNavigationById(id: string) {
  const res = await api.get<NavigationEntity>(NAVIGATION_DETAIL(id));
  return res.data;
}

export async function createNavigation(payload: {
  name: string;
  slug: string;
}) {
  const res = await api.post(NAVIGATIONS_URL, payload);
  return res.data;
}

export async function updateNavigation(
  id: string,
  payload: {
    name: string;
    slug: string;
  }
) {
  const res = await api.put(NAVIGATION_DETAIL(id), payload);
  return res.data;
}

export async function deleteNavigation(id: string) {
  await api.delete(NAVIGATION_DETAIL(id));
}

export async function reorderNavigations(payload: { ordered_ids: string[] }) {
  const res = await api.post(NAVIGATION_REORDER, payload);
  return res.data;
}