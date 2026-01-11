import { api } from "@/lib/http/client";
import type { School } from "../types/schools.types";
import type { SchoolFormValues } from "../schemas/schools.schema";

const BASE = "/api/v1/org/schools/";

export const schoolsApi = {
  list: async (): Promise<School[]> => {
    const res = await api.get<School[]>(BASE);
    return res.data;
  },
  create: async (payload: SchoolFormValues): Promise<School> => {
    const res = await api.post<School>(BASE, payload);
    return res.data;
  },
  get: async (id: string): Promise<School> => {
    const res = await api.get<School>(`${BASE}${id}/`);
    return res.data;
  },
  update: async (id: string, payload: SchoolFormValues): Promise<School> => {
    const res = await api.put<School>(`${BASE}${id}/`, payload);
    return res.data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}${id}/`);
  },
};

export const schoolsKeys = {
  all: ["org", "schools"] as const,
  list: () => ["org", "schools", "list"] as const,
  detail: (id: string) => ["org", "schools", "detail", id] as const,
};
