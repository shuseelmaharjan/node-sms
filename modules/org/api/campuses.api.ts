import { api } from "@/lib/http/client";
import type { Campus } from "../types/campuses.types";
import type { CampusFormValues } from "../schemas/campuses.schema";

const BASE = "/api/v1/org/campuses/";

export const campusesApi = {
  list: async (): Promise<Campus[]> => {
    const res = await api.get<Campus[]>(BASE);
    return res.data;
  },
  create: async (payload: CampusFormValues): Promise<Campus> => {
    const res = await api.post<Campus>(BASE, payload);
    return res.data;
  },
  get: async (id: string): Promise<Campus> => {
    const res = await api.get<Campus>(`${BASE}${id}/`);
    return res.data;
  },
  update: async (id: string, payload: CampusFormValues): Promise<Campus> => {
    const res = await api.put<Campus>(`${BASE}${id}/`, payload);
    return res.data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}${id}/`);
  },
};

export const campusesKeys = {
  all: ["org", "campuses"] as const,
  list: () => ["org", "campuses", "list"] as const,
  detail: (id: string) => ["org", "campuses", "detail", id] as const,
};
