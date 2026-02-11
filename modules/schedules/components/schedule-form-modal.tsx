"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/api";
import { handleFormError } from "@/lib/handleFormError";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard } from "@/components/form/FormWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Schedule, ScheduleCreatePayload, ScheduleKind } from "../types/schedule.types";
import { scheduleSchema, type ScheduleValues } from "../schema/schedule.schema";

import { useBatches, useClasses, useSections, useSubjects, useTeachers } from "../hooks/schedule.hooks";

const LIST_URL = "/api/v1/academics/schedules/";
const DETAIL_URL = (id: string) => `/api/v1/academics/schedules/${id}/`;

const NONE_SECTION = "__none__";
const WHOLE_BATCH = "__batch__"; 

const DAYS = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
];

const KINDS: Array<{ value: ScheduleKind; label: string }> = [
    { value: "class", label: "Class" },
    { value: "break", label: "Break" },
    { value: "holiday", label: "Holiday" },
];

function hhmm(v?: string | null) {
    if (!v) return "";
    return v.slice(0, 5);
}

function inferKind(entity: Schedule): ScheduleKind {
    // If backend doesn't send kind, infer:
    // - if it has subject/teacher => "class"
    // - else default to "break" (or "holiday" if you prefer)
    if (entity.kind) return entity.kind;
    if (entity.subject_id || entity.teacher_id) return "class";
    return "break";
}

function toDefaults(entity: Schedule): ScheduleValues {
    const kind = inferKind(entity);

    return {
        kind,
        // Title mandatory: fallback from API if title not provided
        title: (entity.title ?? entity.subject_name ?? "").trim(),

        batch_id: entity.batch_id ? String(entity.batch_id) : "",

        // always string, never undefined
        academic_class_id: entity.academic_class_id ?? (kind === "class" ? "" : WHOLE_BATCH),
        section_id: entity.section_id ?? NONE_SECTION,

        subject_id: entity.subject_id ?? "",
        teacher_id: entity.teacher_id ?? "",

        day_of_week: typeof entity.day_of_week === "number" ? entity.day_of_week : 0,
        start_time: hhmm(entity.start_time),
        end_time: hhmm(entity.end_time),
    };
}

const createDefaults: ScheduleValues = {
    kind: "class",
    title: "",
    batch_id: "",
    academic_class_id: "",
    section_id: NONE_SECTION,
    subject_id: "",
    teacher_id: "",
    day_of_week: 0,
    start_time: "",
    end_time: "",
};

function toPayload(values: ScheduleValues): ScheduleCreatePayload {
    return {
        batch_id: Number(values.batch_id),

        kind: values.kind,
        title: values.title.trim(),

        academic_class_id: values.academic_class_id === WHOLE_BATCH ? null : (values.academic_class_id || null),

        section_id:
            values.academic_class_id === WHOLE_BATCH
                ? null
                : values.section_id === NONE_SECTION
                    ? null
                    : values.section_id,

        subject_id: values.kind === "class" ? values.subject_id : null,
        teacher_id: values.kind === "class" ? values.teacher_id : null,

        day_of_week: values.day_of_week,
        start_time: values.start_time,
        end_time: values.end_time,
    };
}

export function ScheduleFormModal(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editId: string | null; // null=create, else edit
}) {
    const qc = useQueryClient();
    const isEdit = Boolean(props.editId);

    const detailQuery = useQuery({
        queryKey: ["schedules", "detail", props.editId ?? null],
        enabled: props.open && isEdit && Boolean(props.editId),
        queryFn: async () => {
            const res = await api.get<Schedule>(DETAIL_URL(props.editId!));
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: ScheduleValues) => {
            const res = await api.post(LIST_URL, toPayload(values));
            return res.data;
        },
        onSuccess: async () => {
            toast.success("Created");
            await qc.invalidateQueries({ queryKey: ["schedules", "list"] });
            props.onOpenChange(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (values: ScheduleValues) => {
            const res = await api.patch(DETAIL_URL(props.editId!), toPayload(values));
            return res.data;
        },
        onSuccess: async () => {
            toast.success("Updated");
            await qc.invalidateQueries({ queryKey: ["schedules", "list"] });
            await qc.invalidateQueries({ queryKey: ["schedules", "detail", props.editId] });
            props.onOpenChange(false);
        },
    });

    const blocked = detailQuery.isFetching || createMutation.isPending || updateMutation.isPending;
    const entity = detailQuery.data ?? null;

    const defaultValues = React.useMemo<ScheduleValues>(() => {
        if (isEdit && entity) return toDefaults(entity);
        return createDefaults;
    }, [isEdit, entity]);

    const resetKey = React.useMemo(() => {
        if (!props.open) return "closed";
        if (!isEdit) return "create-open";
        return entity ? `edit-${props.editId}-ready` : `edit-${props.editId}-loading`;
    }, [props.open, isEdit, entity, props.editId]);

    return (
        <Dialog
            open={props.open}
            onOpenChange={(v) => {
                props.onOpenChange(v);
            }}
        >
            <DialogContent className="sm:max-w-[720px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Update Schedule" : "Add Schedule"}</DialogTitle>
                </DialogHeader>

                <FormWizard
                    schema={scheduleSchema}
                    defaultValues={defaultValues}
                    resetKey={resetKey}
                    blocked={blocked}
                    submitLoading={createMutation.isPending || updateMutation.isPending}
                    submitLabel={isEdit ? "Update" : "Create"}
                    disableSubmitUntilDirty={isEdit}
                    onCancel={() => props.onOpenChange(false)}
                    onSubmit={async (values, methods) => {
                        try {
                            if (isEdit) await updateMutation.mutateAsync(values);
                            else await createMutation.mutateAsync(values);
                        } catch (error) {
                            handleFormError(error, { setError: methods.setError });
                        }
                    }}
                    render={(methods) => {
                        const kind = methods.watch("kind") as ScheduleKind;
                        const batchId = methods.watch("batch_id") as string;
                        const classId = methods.watch("academic_class_id") as string;
                        const subjectId = methods.watch("subject_id") as string;

                        const classSelected = Boolean(classId) && classId !== WHOLE_BATCH;

                        const batchesQ = useBatches();
                        const classesQ = useClasses(batchId);
                        const sectionsQ = useSections(classSelected ? classId : undefined);
                        const subjectsQ = useSubjects();
                        const teachersQ = useTeachers(subjectId, "");

                        const errors = methods.formState.errors as any;

                        // IMPORTANT: prevent "wipe on initial hydrate"
                        const prevBatchRef = React.useRef<string | null>(null);
                        const prevClassRef = React.useRef<string | null>(null);
                        const prevSubjectRef = React.useRef<string | null>(null);
                        const prevKindRef = React.useRef<ScheduleKind | null>(null);

                        React.useEffect(() => {
                            if (prevBatchRef.current === null) {
                                prevBatchRef.current = batchId;
                                return;
                            }
                            if (prevBatchRef.current === batchId) return;
                            prevBatchRef.current = batchId;

                            // user changed batch -> reset dependents
                            methods.setValue("section_id", NONE_SECTION, { shouldDirty: true });
                            methods.setValue("subject_id", "", { shouldDirty: true });
                            methods.setValue("teacher_id", "", { shouldDirty: true });

                            if (kind === "class") methods.setValue("academic_class_id", "", { shouldDirty: true });
                            else methods.setValue("academic_class_id", WHOLE_BATCH, { shouldDirty: true });
                            // eslint-disable-next-line react-hooks/exhaustive-deps
                        }, [batchId]);

                        React.useEffect(() => {
                            if (prevClassRef.current === null) {
                                prevClassRef.current = classId;
                                return;
                            }
                            if (prevClassRef.current === classId) return;
                            prevClassRef.current = classId;

                            methods.setValue("section_id", NONE_SECTION, { shouldDirty: true });
                            // eslint-disable-next-line react-hooks/exhaustive-deps
                        }, [classId]);

                        React.useEffect(() => {
                            if (prevSubjectRef.current === null) {
                                prevSubjectRef.current = subjectId;
                                return;
                            }
                            if (prevSubjectRef.current === subjectId) return;
                            prevSubjectRef.current = subjectId;

                            methods.setValue("teacher_id", "", { shouldDirty: true });
                            // eslint-disable-next-line react-hooks/exhaustive-deps
                        }, [subjectId]);

                        React.useEffect(() => {
                            if (prevKindRef.current === null) {
                                prevKindRef.current = kind;
                                return;
                            }
                            if (prevKindRef.current === kind) return;
                            prevKindRef.current = kind;

                            if (kind !== "class") {
                                // keep class as scope if empty
                                if (!methods.getValues("academic_class_id")) {
                                    methods.setValue("academic_class_id", WHOLE_BATCH, { shouldDirty: true });
                                }
                                methods.setValue("subject_id", "", { shouldDirty: true });
                                methods.setValue("teacher_id", "", { shouldDirty: true });
                            } else {
                                if (methods.getValues("academic_class_id") === WHOLE_BATCH) {
                                    methods.setValue("academic_class_id", "", { shouldDirty: true });
                                }
                            }
                            // eslint-disable-next-line react-hooks/exhaustive-deps
                        }, [kind]);

                        const subjectOptions = (subjectsQ.data?.results ?? []).map((s) => ({
                            value: s.id,
                            label: `${s.name} (${s.code})`,
                        }));

                        const teacherOptions = (teachersQ.data?.results ?? []).map((t) => ({
                            value: t.id,
                            label: `${t.full_name}${t.phone ? ` • ${t.phone}` : ""}`,
                        }));

                        return (
                            <div className="space-y-6">
                                {/* Type */}
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={kind}
                                        onValueChange={(v) => methods.setValue("kind", v as ScheduleKind, { shouldDirty: true })}
                                        disabled={blocked}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {KINDS.map((k) => (
                                                <SelectItem key={k.value} value={k.value}>
                                                    {k.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Title */}
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={(methods.watch("title") as string) || ""}
                                        onChange={(e) => methods.setValue("title", e.target.value, { shouldDirty: true })}
                                        disabled={blocked}
                                        placeholder={kind === "class" ? "e.g. Mathematics" : kind === "break" ? "e.g. Lunch Break" : "e.g. Weekly Off"}
                                    />
                                    {errors?.title?.message ? <p className="text-xs text-destructive">{String(errors.title.message)}</p> : null}
                                </div>

                                {/* Batch */}
                                <div className="grid gap-2">
                                    <Label>Batch</Label>
                                    <Select
                                        value={batchId}
                                        onValueChange={(v) => methods.setValue("batch_id", v, { shouldDirty: true })}
                                        disabled={blocked}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={batchesQ.isLoading ? "Loading..." : "Select batch"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(batchesQ.data?.results ?? []).map((b) => (
                                                <SelectItem key={b.id} value={String(b.id)}>
                                                    {b.name} {b.is_active ? "" : "(inactive)"}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Class */}
                                <div className="grid gap-2">
                                    <Label>Class {kind === "class" ? "" : "(optional)"}</Label>
                                    <Select
                                        value={classId}
                                        onValueChange={(v) => methods.setValue("academic_class_id", v, { shouldDirty: true })}
                                        disabled={blocked || !batchId}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue
                                                placeholder={
                                                    !batchId
                                                        ? "Select batch first"
                                                        : classesQ.isLoading
                                                            ? "Loading..."
                                                            : kind === "class"
                                                                ? "Select class"
                                                                : "Select scope"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {kind !== "class" ? <SelectItem value={WHOLE_BATCH}>Whole batch</SelectItem> : null}
                                            {(classesQ.data?.results ?? []).map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name} {c.is_active ? "" : "(inactive)"}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Section */}
                                <div className="grid gap-2">
                                    <Label>Section (optional)</Label>
                                    <Select
                                        value={(methods.watch("section_id") as string) || NONE_SECTION}
                                        onValueChange={(v) => methods.setValue("section_id", v, { shouldDirty: true })}
                                        disabled={blocked || !classSelected}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue
                                                placeholder={
                                                    !classSelected
                                                        ? classId === WHOLE_BATCH
                                                            ? "Whole batch selected"
                                                            : "Select class first"
                                                        : sectionsQ.isLoading
                                                            ? "Loading..."
                                                            : "Select section"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE_SECTION}>{kind === "class" ? "No section" : "All sections"}</SelectItem>
                                            {(sectionsQ.data?.results ?? []).map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name} {s.is_active ? "" : "(inactive)"}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Subject + Teacher */}
                                {kind === "class" ? (
                                    <>
                                        {/* Subject */}
                                        <div className="grid gap-2">
                                            <Label>Subject</Label>
                                            <Select
                                                value={methods.watch("subject_id") || "__none__"} // non-empty
                                                onValueChange={(v) =>
                                                    methods.setValue("subject_id", v === "__none__" ? "" : v, { shouldDirty: true })
                                                }
                                                disabled={subjectsQ.isLoading}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={subjectsQ.isLoading ? "Loading..." : "Select subject"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">Select subject</SelectItem>
                                                    {(subjectsQ.data?.results ?? []).map((s) => (
                                                        <SelectItem key={s.id} value={s.id}>
                                                            {s.name} ({s.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {errors?.subject_id?.message ? (
                                                <p className="text-xs text-destructive">{String(errors.subject_id.message)}</p>
                                            ) : null}
                                        </div>

                                        {/* Teacher */}
                                        <div className="grid gap-2">
                                            <Label>Teacher</Label>
                                            <Select
                                                value={methods.watch("teacher_id") || "__none__"}
                                                onValueChange={(v) =>
                                                    methods.setValue("teacher_id", v === "__none__" ? "" : v, { shouldDirty: true })
                                                }
                                                disabled={!methods.watch("subject_id") || teachersQ.isLoading}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue
                                                        placeholder={
                                                            !methods.watch("subject_id")
                                                                ? "Select subject first"
                                                                : teachersQ.isLoading
                                                                    ? "Loading..."
                                                                    : "Select teacher"
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">Select teacher</SelectItem>
                                                    {(teachersQ.data?.results ?? []).map((t) => (
                                                        <SelectItem key={t.id} value={t.id}>
                                                            {t.full_name}{t.phone ? ` • ${t.phone}` : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {errors?.teacher_id?.message ? (
                                                <p className="text-xs text-destructive">{String(errors.teacher_id.message)}</p>
                                            ) : null}
                                        </div>

                                    </>
                                ) : null}

                                {/* Day + time */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label>Day</Label>
                                        <Select
                                            value={String(methods.watch("day_of_week") as number)}
                                            onValueChange={(v) => methods.setValue("day_of_week", Number(v), { shouldDirty: true })}
                                            disabled={blocked}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Day" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAYS.map((d) => (
                                                    <SelectItem key={d.value} value={String(d.value)}>
                                                        {d.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Start</Label>
                                        <Input
                                            type="time"
                                            value={(methods.watch("start_time") as string) || ""}
                                            onChange={(e) => methods.setValue("start_time", e.target.value, { shouldDirty: true })}
                                            disabled={blocked}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>End</Label>
                                        <Input
                                            type="time"
                                            value={(methods.watch("end_time") as string) || ""}
                                            onChange={(e) => methods.setValue("end_time", e.target.value, { shouldDirty: true })}
                                            disabled={blocked}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
