import type { StudentOtherInfo } from "../../types/student360.types";

export function n(v: unknown): number {
  const x = Number(String(v ?? "0").replace(/,/g, ""));
  return Number.isFinite(x) ? x : 0;
}

export function money(v: unknown): string {
  return n(v).toFixed(2);
}

export function countHealthFlags(info: StudentOtherInfo | null | undefined): number {
  if (!info) return 0;
  const keys: Array<keyof StudentOtherInfo> = [
    "is_disabled",
    "visual_issues",
    "hearing_issues",
    "mobility_issues",
    "chronic_illness",
    "allergies",
    "medications",
    "dietary_restrictions",
    "other_health_issues",
  ];
  return keys.reduce((acc, key) => acc + (info[key] ? 1 : 0), 0);
}
