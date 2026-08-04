"use client";

import { useStudentProfileCache } from "./use-student-profile-cache";

/**
 * Backward-compatible helper for existing callers.
 * New profile editors should prefer `useStudentProfileCache`.
 */
export function useRefreshStudentProfile(
  studentId: string,
  managementUserId: string
) {
  return useStudentProfileCache(studentId, managementUserId).refresh;
}
