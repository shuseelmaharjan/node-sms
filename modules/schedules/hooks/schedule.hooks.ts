import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listBatches,
  listClasses,
  listSections,
  listSubjects,
  listTeachers,
  type ScheduleListParams,
} from "../api/schedule.api";

export function useSchedules(params: ScheduleListParams) {
  return useQuery({
    queryKey: ["schedules", "list", params],
    queryFn: () => listSchedules(params),
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateSchedule(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

/* Lookups */
export function useBatches() {
  return useQuery({
    queryKey: ["batches", "list"],
    queryFn: () => listBatches({ page: 1, page_size: 200 }),
  });
}

export function useClasses(batch?: number | string) {
  return useQuery({
    queryKey: ["classes", "list", { batch: batch ?? "" }],
    queryFn: () => listClasses({ page: 1, page_size: 500, batch }),
    enabled: Boolean(batch),
  });
}

export function useSections(filters?: { batch?: number | string; academic_class?: string }) {
  return useQuery({
    queryKey: ["sections", "list", filters ?? {}],
    queryFn: () => listSections({ page: 1, page_size: 500, ...filters }),
    enabled: Boolean(filters?.batch) || Boolean(filters?.academic_class),
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects", "list"],
    queryFn: () => listSubjects({ page: 1, page_size: 500 }),
  });
}

export function useTeachers(search?: string) {
  return useQuery({
    queryKey: ["teachers", "list", { search: search ?? "" }],
    queryFn: () => listTeachers({ page: 1, page_size: 200, search }),
  });
}
