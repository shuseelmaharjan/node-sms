"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Pencil, Trash2, ListOrdered, Filter, BookOpen, Hash, AlignLeft } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DataToolbar } from "@/components/data-table/DataToolbar";
import { SortableList } from "@/components/dnd/SortableList";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { TextareaField } from "@/components/fields/TextareaField";
import { handleFormError } from "@/lib/handleFormError";
import { cn } from "@/lib/utils";

import type { SubjectEntity } from "../types/subject.types";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  reorderSubjects,
  toggleSubjectStatus,
} from "../api/subjects.api";

import {
  subjectCreateSchema,
  subjectUpdateSchema,
  type SubjectUpdateValues,
} from "../schema/subject.schema";

type StatusFilter = "all" | "active" | "inactive";

function bySortOrder(a: { sort_order: number; name: string }, b: { sort_order: number; name: string }) {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.name.localeCompare(b.name);
}

function getErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;

  const clean = (msg: any) => {
    const s = String(msg ?? "").trim();
    return s.startsWith("__all__:") ? s.replace(/^__all__:\s*/, "") : s;
  };

  if (data?.detail) return clean(data.detail);

  if (Array.isArray(data?.__all__) && data.__all__[0]) return clean(data.__all__[0]);

  if (data && typeof data === "object") {
    for (const [, value] of Object.entries(data)) {
      if (Array.isArray(value) && value[0]) return clean(value[0]);
      if (typeof value === "string") return clean(value);
    }
  }

  return fallback;
}

function SubjectRow(props: {
  subj: SubjectEntity;
  canEdit: boolean;
  blocked: boolean;

  onUpdate: (payload: SubjectUpdateValues) => Promise<void>;
  onToggleActive: (nextActive: boolean) => Promise<void>;
  toggling?: boolean;

  onDelete: () => void;
}) {
  const [edit, setEdit] = React.useState(false);
  const active = props.subj.status === "active";

  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-card shadow-sm transition", "hover:shadow-md")}>
      <div className={cn("absolute left-0 top-0 h-full w-1", active ? "bg-emerald-500/30" : "bg-zinc-400/30")} />

      <div className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="pl-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                {props.subj.name}
              </div>

              <Badge variant={active ? "active" : "inactive"} className="text-xs">
                {active ? "Active" : "Inactive"}
              </Badge>

              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                {props.subj.code}
              </span>
            </div>

            {props.subj.description ? (
              <div className="mt-2 text-sm text-muted-foreground max-w-[820px] flex items-start gap-2">
                <AlignLeft className="h-4 w-4 mt-0.5" />
                <span>{props.subj.description}</span>
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <ListOrdered className="h-4 w-4" />
              <span>Order: {props.subj.sort_order}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
              <span className="text-xs text-muted-foreground">{active ? "Active" : "Inactive"}</span>
              <Switch
                checked={active}
                disabled={!props.canEdit || props.blocked || props.toggling}
                onCheckedChange={(v) => props.onToggleActive(Boolean(v))}
              />
            </div>

            {props.canEdit ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-background"
                  disabled={props.blocked}
                  onClick={() => setEdit((p) => !p)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {edit ? "Close" : "Edit"}
                </Button>

                <Button size="sm" variant="destructive" disabled={props.blocked} onClick={props.onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {edit && props.canEdit ? (
          <div className="mt-4 rounded-xl border bg-background p-4">
            <div className="mb-3">
              <div className="text-sm font-semibold">Edit Subject</div>
              <div className="text-xs text-muted-foreground mt-1">Update name, code and description.</div>
            </div>

            <FormWizard
              schema={subjectUpdateSchema}
              defaultValues={{
                name: props.subj.name,
                code: props.subj.code,
                description: props.subj.description ?? "",
              }}
              resetKey={`edit-subject-${props.subj.id}-${props.subj.updated_at ?? ""}`}
              blocked={props.blocked}
              submitLabel="Save changes"
              disableSubmitUntilDirty
              onSubmit={async (values, methods) => {
                try {
                  await props.onUpdate(values as any);
                  setEdit(false);
                } catch (e) {
                  handleFormError(e, { setError: methods.setError });
                }
              }}
              render={(methods) => (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InputField
                    label="Name"
                    required
                    disabled={props.blocked}
                    placeholder="e.g. Mathematics"
                    {...methods.register("name")}
                    error={methods.formState.errors.name as any}
                  />
                  <InputField
                    label="Code"
                    required
                    disabled={props.blocked}
                    placeholder="e.g. MTH-101"
                    {...methods.register("code")}
                    error={methods.formState.errors.code as any}
                  />
                  <div className="md:col-span-3">
                    <TextareaField
                      label="Description (optional)"
                      rows={3}
                      disabled={props.blocked}
                      placeholder="Short description..."
                      {...methods.register("description")}
                      error={methods.formState.errors.description as any}
                    />
                  </div>
                </div>
              )}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SubjectsPage() {
  const qc = useQueryClient();

  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const effectiveStatus: StatusFilter = debouncedQ.trim() ? "all" : status;

  const [deleteTarget, setDeleteTarget] = React.useState<SubjectEntity | null>(null);

  const subjectsQuery = useQuery({
    queryKey: ["subjects", "list", { status: effectiveStatus, q: debouncedQ }],
    queryFn: async () => {
      const search = debouncedQ.trim() || undefined;
      return fetchSubjects({
        page: 1,
        page_size: 500,
        search,
        status: effectiveStatus,
        ordering: "sort_order,name",
      });
    },
    placeholderData: keepPreviousData,
  });

  const subjects: SubjectEntity[] = React.useMemo(() => {
    const rows = subjectsQuery.data?.results ?? [];
    return [...rows].sort(bySortOrder);
  }, [subjectsQuery.data?.results]);

  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: async () => {
      toast.success("Subject created");
      await qc.invalidateQueries({ queryKey: ["subjects", "list"] });
    },
    onError: (e: any) => toast.error(getErrorMessage(e, "Failed to create subject")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateSubject(id, payload),
    onSuccess: async () => {
      toast.success("Subject updated");
      await qc.invalidateQueries({ queryKey: ["subjects", "list"] });
    },
    onError: (e: any) => toast.error(getErrorMessage(e, "Failed to update subject")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: async () => {
      toast.success("Subject deleted");
      await qc.invalidateQueries({ queryKey: ["subjects", "list"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(getErrorMessage(e, "Failed to delete subject")),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderSubjects,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["subjects", "list"] });
    },
    onError: (e: any) => toast.error(getErrorMessage(e, "Failed to reorder subjects")),
  });

  // ✅ Toggle uses the NEW endpoint
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) =>
      toggleSubjectStatus(id, status),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["subjects", "list"] });
    },
    onError: (e: any) => toast.error(getErrorMessage(e, "Failed to update status")),
  });

  const loading = subjectsQuery.isFetching;

  const blocked =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    reorderMutation.isPending ||
    toggleStatusMutation.isPending;

  const canEdit = true;

  return (
    <>
      <PageShell title="Subjects" description="Create, edit, reorder and quickly enable/disable subjects.">
        <div className="mb-5">
          <DataToolbar
            loading={loading}
            disabled={blocked}
            search={{
              value: q,
              onChange: setQ,
              placeholder: "Search subjects",
              enabled: true,
              disabled: false,
            }}
            filters={{
              status: {
                label: "Status",
                icon: <Filter className="h-4 w-4" />,
                value: status,
                onChange: (v) => setStatus(v as StatusFilter),
                options: [
                  { value: "all", label: "All" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ],
                placeholder: "Filter status",
                disabled: Boolean(debouncedQ.trim()),
              },
            }}
            refresh={{
              onClick: () => qc.invalidateQueries({ queryKey: ["subjects", "list"] }),
              disabled: blocked,
              icon: <RefreshCw className="h-4 w-4" />,
              title: "Refresh",
            }}
          />
        </div>

        {/* Create card */}
        <div className="rounded-2xl border bg-gradient-to-b from-primary/5 to-transparent p-4 sm:p-5 mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Add Subject
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                New subjects are created as <span className="font-medium">Active</span> and appended to the end.
              </div>
            </div>

            <Badge className="w-fit text-xs bg-background/70 border border-primary/20 text-foreground">
              {subjects.length} subjects
            </Badge>
          </div>

          <div className="mt-4 rounded-xl border bg-card p-4">
            <FormWizard
              schema={subjectCreateSchema}
              defaultValues={{ name: "", code: "", description: "" }}
              resetKey="create-subject"
              blocked={blocked}
              submitLabel="Create Subject"
              submitLoading={createMutation.isPending}
              disableSubmitUntilDirty={false}
              onSubmit={async (values: any, methods: any) => {
                try {
                  const nextSort = subjects.length;
                  await createMutation.mutateAsync({
                    name: values.name,
                    code: values.code,
                    description: values.description || "",
                    status: "active",
                    sort_order: nextSort,
                  });
                  methods.reset({ name: "", code: "", description: "" });
                } catch (e) {
                  handleFormError(e, { setError: methods.setError });
                }
              }}
              render={(methods) => (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InputField
                    label="Name"
                    required
                    disabled={blocked}
                    placeholder="e.g. Mathematics"
                    {...methods.register("name")}
                    error={methods.formState.errors.name as any}
                  />
                  <InputField
                    label="Code"
                    required
                    disabled={blocked}
                    placeholder="e.g. MTH-101"
                    {...methods.register("code")}
                    error={methods.formState.errors.code as any}
                  />
                  <div className="md:col-span-3">
                    <TextareaField
                      label="Description (optional)"
                      rows={3}
                      disabled={blocked}
                      placeholder="Short description..."
                      {...methods.register("description")}
                      error={methods.formState.errors.description as any}
                    />
                  </div>
                </div>
              )}
            />
          </div>
        </div>

        {/* List */}
        {subjectsQuery.isError ? (
          <div className="rounded-lg border bg-card p-4 text-sm">Failed to load subjects.</div>
        ) : subjects.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">No subjects yet.</div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              Drag rows to reorder • Toggle to enable/disable
            </div>

            <SortableList<SubjectEntity>
              items={subjects}
              disabled={!canEdit || blocked}
              onReorder={(next) => {
                qc.setQueryData(["subjects", "list", { status: effectiveStatus, q: debouncedQ }], (old: any) => {
                  if (!old?.results) return old;
                  const withSort = next.map((x, i) => ({ ...x, sort_order: i }));
                  return { ...old, results: withSort };
                });

                reorderMutation.mutate(next.map((x, i) => ({ id: x.id, sort_order: i })));
              }}
              itemClassName="rounded-xl"
              renderItem={(subj) => (
                <SubjectRow
                  subj={subj}
                  canEdit={canEdit}
                  blocked={blocked}
                  toggling={toggleStatusMutation.isPending}
                  onToggleActive={async (nextActive) => {
                    const nextStatus = nextActive ? "active" : "inactive";

                    // optimistic toggle
                    qc.setQueryData(["subjects", "list", { status: effectiveStatus, q: debouncedQ }], (old: any) => {
                      if (!old?.results) return old;
                      const nextResults = old.results.map((x: SubjectEntity) =>
                        x.id === subj.id ? { ...x, status: nextStatus } : x
                      );
                      return { ...old, results: nextResults };
                    });

                    await toggleStatusMutation.mutateAsync({ id: subj.id, status: nextStatus });
                  }}
                  onUpdate={async (values) => updateMutation.mutateAsync({ id: subj.id, payload: values })}
                  onDelete={() => setDeleteTarget(subj)}
                />
              )}
            />
          </div>
        )}
      </PageShell>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        title="Delete this subject?"
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
