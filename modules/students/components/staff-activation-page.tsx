"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/api";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { FormWizard } from "@/components/form/FormWizard";
import { handleFormError } from "@/lib/handleFormError";

import {
  teacherActivationSchema,
  type TeacherActivationValues,
} from "../schema/teacher-activation.schema";

type StaffDetail = {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone: string;
  email?: string;
  username?: string;
  role?: string;
  status?: string;
  profile?: {
    id: string;
    date_of_birth_in_ad?: string | null;
    date_of_birth_in_bs?: string | null;
    gender?: string | null;
    blood_group?: string | null;
    nationality?: string | null;
    religion?: string | null;
    mother_tongue?: string | null;
    citizenship_no?: string | null;
    pan_no?: string | null;
  } | null;
};

type SubjectEntity = {
  id: string;
  name: string;
  code?: string;
  status: string;
  serial?: number;
};

type TeacherLevelEntity = {
  id: string;
  level: string;
  status: string;
  serial?: number;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  meta?: any;
  results: T[];
};

const SUBJECTS_URL = "/api/v1/subjects/?status=active";
const TEACHER_LEVELS_URL = "/api/v1/teacher-levels/?status=active";
const STAFF_DETAIL_URL = (id: string) => `/api/onboarding/staff-users/${id}/`;
const CREATE_SPECIALIZATION_URL = "/api/v1/teacher-specializations/";

function fullName(u: StaffDetail) {
  return [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" ");
}

export function StaffActivationPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const sp = useSearchParams();
  const userId = (sp.get("user") || "").trim();

  // ---- queries ----
  const staffQuery = useQuery<StaffDetail>({
    queryKey: ["staff", "activation", "detail", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const res = await api.get<StaffDetail>(STAFF_DETAIL_URL(userId));
      return res.data;
    },
  });

  const subjectsQuery = useQuery<PaginatedResponse<SubjectEntity>>({
    queryKey: ["subjects", "active"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<SubjectEntity>>(SUBJECTS_URL);
      return res.data;
    },
  });

  const levelsQuery = useQuery<PaginatedResponse<TeacherLevelEntity>>({
    queryKey: ["teacher-levels", "active"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<TeacherLevelEntity>>(TEACHER_LEVELS_URL);
      return res.data;
    },
  });

  const staff = staffQuery.data ?? null;
  const subjects = subjectsQuery.data?.results ?? [];
  const levels = levelsQuery.data?.results ?? [];

  // ---- mutation ----
  const createMutation = useMutation({
    mutationFn: async (values: TeacherActivationValues) => {
      const payload = {
        user: userId,
        teacher_level: values.teacher_level || null,
        subjects: values.subjects ?? [],
      };
      const res = await api.post(CREATE_SPECIALIZATION_URL, payload);
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Teacher specialization assigned.");
      await qc.invalidateQueries({ queryKey: ["staff", "list"] });
      router.push("/staff-enrollment");
    },
    onError: (e: any) => {
      toast.error(
        e?.response?.data?.detail ??
          e?.response?.data?.message ??
          "Failed to assign specialization."
      );
    },
  });

  const blocked =
    createMutation.isPending ||
    staffQuery.isFetching ||
    subjectsQuery.isFetching ||
    levelsQuery.isFetching;

  // ---- defaults / resetKey ----
  const defaultValues = React.useMemo<TeacherActivationValues>(
    () => ({
      teacher_level: "",
      subjects: [],
    }),
    []
  );

  const resetKey = React.useMemo(() => {
    // reset when:
    // - user changes
    // - staff loaded (so UI becomes consistent)
    if (!userId) return "missing-user";
    if (staffQuery.isFetching) return `loading-${userId}`;
    return `ready-${userId}`;
  }, [userId, staffQuery.isFetching]);

  // ---- guard ----
  if (!userId) {
    return (
      <PageShell title="Teacher Activation" description="Assign teacher specialization.">
        <Card className="p-6">
          <div className="space-y-2">
            <div className="text-lg font-semibold">Missing user id</div>
            <div className="text-sm text-muted-foreground">
              Open this page with <span className="font-mono">?user=&lt;uuid&gt;</span>
            </div>
            <div>
              <Button variant="outline" onClick={() => router.back()}>
                Go back
              </Button>
            </div>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Teacher Activation" description="Review staff and assign specialization.">
      <div className="space-y-6">
        {/* USER INFO (more friendly card) */}
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="text-xl font-semibold">
                {staff ? fullName(staff) : "Loading..."}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono text-foreground">{staff?.phone ?? "-"}</span>
                {staff?.email ? <span>• {staff.email}</span> : null}
                {staff?.username ? <span className="font-mono">• @{staff.username}</span> : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge>{(staff?.role ?? "-").toUpperCase()}</Badge>
                <Badge
                  variant={(staff?.status ?? "").toLowerCase() === "active" ? "active" : "inactive"}
                >
                  {(staff?.status ?? "-").toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()} disabled={blocked}>
                Back
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <InfoItem label="DOB (AD)" value={staff?.profile?.date_of_birth_in_ad ?? "-"} mono />
            <InfoItem label="DOB (BS)" value={staff?.profile?.date_of_birth_in_bs ?? "-"} mono />
            <InfoItem label="Gender" value={staff?.profile?.gender ?? "-"} />
            <InfoItem label="Blood group" value={staff?.profile?.blood_group ?? "-"} />
            <InfoItem label="Nationality" value={staff?.profile?.nationality ?? "-"} />
            <InfoItem label="Religion" value={staff?.profile?.religion ?? "-"} />
          </div>
        </Card>

        {/* FORM (FormWizard) */}
        <Card className="p-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold">Assign specialization</div>
              <div className="text-sm text-muted-foreground">
                Select teacher level and subjects this teacher can teach.
              </div>
            </div>

            {/* quick actions */}
            <div className="mt-2 flex gap-2 md:mt-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={blocked || subjects.length === 0}
                onClick={() => {
                  // will also mark dirty inside FormWizard when user changes values
                  // (we set values inside render using methods)
                  // This button is just for UX; actual setting is done in render
                  toast.message("Use Select all inside the form.");
                }}
              >
                Tip: Select all inside form
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <FormWizard
            schema={teacherActivationSchema}
            defaultValues={defaultValues}
            resetKey={resetKey}
            blocked={blocked}
            submitLoading={createMutation.isPending}
            submitLabel="Submit specialization"
            disableSubmitUntilDirty={true}
            onCancel={() => router.back()}
            onSubmit={async (values, methods) => {
              try {
                if ((staff?.role ?? "").toLowerCase() !== "teacher") {
                  toast.error("This activation form is for teachers only.");
                  return;
                }
                await createMutation.mutateAsync(values);
              } catch (error) {
                handleFormError(error, { setError: methods.setError });
              }
            }}
            render={(methods) => {
              const selectedSubjects = methods.watch("subjects") ?? [];
              const selectedTeacherLevel = methods.watch("teacher_level") ?? "";

              const toggleSubject = (id: string, checked: boolean) => {
                const next = checked
                  ? Array.from(new Set([...selectedSubjects, id]))
                  : selectedSubjects.filter((x) => x !== id);

                methods.setValue("subjects", next, { shouldDirty: true, shouldValidate: true });
              };

              const selectAll = () => {
                methods.setValue(
                  "subjects",
                  subjects.map((s) => s.id),
                  { shouldDirty: true, shouldValidate: true }
                );
              };

              const clearAll = () => {
                methods.setValue("subjects", [], { shouldDirty: true, shouldValidate: true });
              };

              return (
                <div className="space-y-6">
                  {/* Teacher level */}
                  <div className="space-y-2">
                    <Label>Teacher level</Label>

                    <Select
                      value={selectedTeacherLevel}
                      onValueChange={(v) =>
                        methods.setValue("teacher_level", v, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      disabled={blocked || levelsQuery.isError}
                    >
                      <SelectTrigger className="w-full md:w-[420px]">
                        <SelectValue
                          placeholder={
                            levelsQuery.isError ? "Failed to load levels" : "Select teacher level"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((lvl) => (
                          <SelectItem key={lvl.id} value={lvl.id}>
                            {lvl.level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {methods.formState.errors.teacher_level ? (
                      <p className="text-sm text-destructive">
                        {methods.formState.errors.teacher_level.message as any}
                      </p>
                    ) : null}
                  </div>

                  <Separator />

                  {/* Subjects */}
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <Label>Subjects</Label>
                        <div className="text-xs text-muted-foreground">
                          Pick one or more subjects.
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={blocked || subjects.length === 0}
                          onClick={selectAll}
                        >
                          Select all
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={blocked || selectedSubjects.length === 0}
                          onClick={clearAll}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    {subjectsQuery.isError ? (
                      <div className="text-sm text-destructive">Failed to load subjects.</div>
                    ) : subjects.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No active subjects found.</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {subjects.map((s) => {
                          const checked = selectedSubjects.includes(s.id);
                          return (
                            <label
                              key={s.id}
                              className="flex items-center gap-3 rounded-md border p-3 transition hover:bg-muted/30 cursor-pointer"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => toggleSubject(s.id, Boolean(v))}
                                disabled={blocked}
                              />
                              <div className="flex min-w-0 flex-col">
                                <span className="font-medium truncate">{s.name}</span>
                                {s.code ? (
                                  <span className="text-xs text-muted-foreground truncate">{s.code}</span>
                                ) : null}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {methods.formState.errors.subjects ? (
                      <p className="text-sm text-destructive">
                        {methods.formState.errors.subjects.message as any}
                      </p>
                    ) : null}

                    {/* small helpful summary */}
                    <div className="text-xs text-muted-foreground">
                      Selected: <span className="font-medium">{selectedSubjects.length}</span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </Card>
      </div>
    </PageShell>
  );
}

function InfoItem(props: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <div className={props.mono ? "font-mono" : ""}>{props.value ?? "-"}</div>
    </div>
  );
}
