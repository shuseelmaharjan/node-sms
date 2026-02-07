"use client";

import * as React from "react";
import {
    useMutation,
    useQuery,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
    RefreshCw,
    Filter,
    ChevronDown,
    ChevronRight,
    Layers,
    Plus,
    Pencil,
    Trash2,
    ListOrdered,
    EyeClosed,
} from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { DataToolbar } from "@/components/data-table/DataToolbar";
import { SortableList } from "@/components/dnd/SortableList";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";

import type { ClassroomEntity, SectionEntity } from "../types/classroom.types";
import {
    fetchBatches,
    fetchClassrooms,
    fetchSections,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    reorderClassrooms,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
} from "../api/classrooms.api";

import {
    classroomCreateSchema,
    classroomUpdateSchema,
    type ClassroomCreateValues,
    type ClassroomUpdateValues,
} from "../schema/classroom.schema";
import {
    sectionCreateSchema,
    sectionUpdateSchema,
    type SectionCreateValues,
    type SectionUpdateValues,
} from "../schema/section.schema";

type StatusFilter = "all" | "active" | "inactive";

function bySortOrder(
    a: { sort_order: number; name: string },
    b: { sort_order: number; name: string }
) {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.name.localeCompare(b.name);
}

/**
 * Reusable Name form card (works for Create + Edit)
 * - Uses FormWizard + InputField
 * - You pass schema, defaultValues, resetKey, submitLabel, etc.
 */
function NameFormCard<TValues extends { name: string }>(props: {
    title: string;
    description?: string;

    blocked: boolean;
    schema: any;

    defaultValues: TValues;
    resetKey: string;

    submitLabel: string;
    submitLoading?: boolean;

    disableSubmitUntilDirty?: boolean;

    onSubmit: (values: TValues, methods: any) => Promise<void>;
}) {
    return (
        <div className="rounded-xl border bg-white p-4">
            <div className="mb-3">
                <div className="text-sm font-semibold">{props.title}</div>
                {props.description ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                        {props.description}
                    </div>
                ) : null}
            </div>

            <FormWizard
                schema={props.schema}
                defaultValues={props.defaultValues}
                resetKey={props.resetKey}
                blocked={props.blocked}
                disableSubmitUntilDirty={props.disableSubmitUntilDirty ?? true}
                submitLabel={props.submitLabel}
                submitLoading={props.submitLoading}
                onSubmit={async (values: any, methods: any) => {
                    await props.onSubmit(values, methods);
                }}
                render={(methods) => (
                    <div className="space-y-3">
                        <InputField
                            label="Name"
                            required
                            placeholder="Type a name…"
                            disabled={props.blocked}
                            {...methods.register("name")}
                            error={methods.formState.errors.name as any}
                        />
                    </div>
                )}
            />
        </div>
    );
}

function AddSectionInline(props: {
    blocked: boolean;
    onCreate: (values: SectionCreateValues) => Promise<void>;
    resetKey: string; // make it unique per class
    sectionCount: number;
}) {
    const [open, setOpen] = React.useState(false);

    return (
        <div className="w-full sm:w-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">Add new section</div>
                    <Badge className="text-xs bg-primary/15 text-foreground border border-primary/20">
                        {props.sectionCount}
                    </Badge>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant={open ? "secondary" : "outline"}
                    disabled={props.blocked}
                    onClick={() => setOpen((p) => !p)}
                    className="bg-background"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {open ? "Close" : "Add Section"}
                </Button>
            </div>

            {open ? (
                <div className="mt-3">
                    <NameFormCard<SectionCreateValues>
                        title="New Section"
                        description="Creates a section and appends it to the list."
                        blocked={props.blocked}
                        schema={sectionCreateSchema}
                        defaultValues={{ name: "", is_active: true }}
                        resetKey={props.resetKey}
                        submitLabel="Create Section"
                        disableSubmitUntilDirty={false}
                        onSubmit={async (values, methods) => {
                            await props.onCreate(values);
                            methods.reset({ name: "", is_active: true });
                            setOpen(false);
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
}

// ---------------------------
// Section row
// ---------------------------
function SectionRow(props: {
    sec: SectionEntity;
    canEdit: boolean;
    blocked: boolean;
    onUpdate: (payload: { name?: string; is_active?: boolean }) => Promise<void>;
    onDelete: () => void;
}) {
    const [edit, setEdit] = React.useState(false);

    return (
        <div className="relative overflow-hidden rounded-lg">
            {/* left accent (soft color) */}
            <div className="absolute left-0 top-0 h-full w-1 bg-primary/20" />

            <div className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 pl-2">
                        <span className="font-medium">{props.sec.name}</span>
                        <Badge
                            variant={props.sec.is_active ? "active" : "inactive"}
                            className="text-xs"
                        >
                            {props.sec.is_active ? "Active" : "Inactive"}
                        </Badge>
                    </div>

                    {props.canEdit ? (
                        <div className="flex items-center gap-2">
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

                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={props.blocked}
                                onClick={props.onDelete}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    ) : null}
                </div>

                {edit && props.canEdit ? (
                    <div className="mt-3">
                        <NameFormCard<SectionUpdateValues>
                            title="Edit Section"
                            description="Update the section name."
                            blocked={props.blocked}
                            schema={sectionUpdateSchema}
                            defaultValues={{ name: props.sec.name, is_active: props.sec.is_active }}
                            resetKey={`edit-section-${props.sec.id}-${props.sec.name}`}
                            submitLabel="Save changes"
                            disableSubmitUntilDirty
                            onSubmit={async (values) => {
                                await props.onUpdate({ name: values.name, is_active: values.is_active });
                                setEdit(false);
                            }}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// ---------------------------
// Class card
// ---------------------------
function ClassCard(props: {
    cls: ClassroomEntity;
    canEdit: boolean;
    blocked: boolean;
    open: boolean;
    onToggle: () => void;

    sections: SectionEntity[];

    onUpdate: (payload: { name?: string; is_active?: boolean }) => Promise<void>;
    onDelete: () => void;

    onCreateSection: (values: SectionCreateValues) => Promise<void>;
    onReorderSections: (next: SectionEntity[]) => void;
    onUpdateSection: (
        id: string,
        payload: { name?: string; is_active?: boolean }
    ) => Promise<void>;
    onDeleteSection: (sec: SectionEntity) => void;
}) {
    const [edit, setEdit] = React.useState(false);

    React.useEffect(() => setEdit(false), [props.cls.id]);

    return (
        <div className="p-4">
            {/* header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{props.cls.name}</span>
                        <Badge
                            variant={props.cls.is_active ? "active" : "inactive"}
                            className="text-xs"
                        >
                            {props.cls.is_active ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        Manage sections under this class. Drag to reorder.
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={props.onToggle}>
                        {props.open ? <EyeClosed /> : <Layers className="h-4 w-4" />}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-background"
                        disabled={!props.canEdit || props.blocked}
                        onClick={() => setEdit((p) => !p)}
                    >
                        <Pencil className="h-4 w-4 mr-2" />
                        {edit ? "Cancel" : "Edit"}
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={!props.canEdit || props.blocked}
                        onClick={props.onDelete}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* edit panel (uses SAME form card) */}
            {edit && props.canEdit ? (
                <div className="mt-4">
                    <NameFormCard<ClassroomUpdateValues>
                        title="Edit Class"
                        description="Update the class name."
                        blocked={props.blocked}
                        schema={classroomUpdateSchema}
                        defaultValues={{ name: props.cls.name, is_active: props.cls.is_active }}
                        resetKey={`edit-class-${props.cls.id}-${props.cls.name}`}
                        submitLabel="Save changes"
                        disableSubmitUntilDirty
                        onSubmit={async (values) => {
                            await props.onUpdate({ name: values.name, is_active: values.is_active });
                            setEdit(false);
                        }}
                    />
                </div>
            ) : null}

            {/* sections panel */}
            {props.open ? (
                <div className="mt-4 rounded-xl border bg-primary/5 p-4">
                    {props.canEdit ? (
                        <div className="mt-3 w-full">
                            <AddSectionInline
                                blocked={props.blocked}
                                resetKey={`create-section-${props.cls.id}`}
                                onCreate={props.onCreateSection}
                                sectionCount={props.sections.length}
                            />
                        </div>
                    ) : null}

                    <div className="mt-4">
                        {props.sections.length === 0 ? (
                            <div className="rounded-lg border bg-background p-5 text-sm text-muted-foreground">
                                No sections yet.
                            </div>
                        ) : (
                            <SortableList<SectionEntity>
                                items={props.sections}
                                disabled={!props.canEdit || props.blocked}
                                onReorder={props.onReorderSections}
                                itemClassName="rounded-lg border bg-background hover:bg-muted/20 transition"
                                renderItem={(sec) => (
                                    <SectionRow
                                        sec={sec}
                                        canEdit={props.canEdit}
                                        blocked={props.blocked}
                                        onUpdate={(payload) => props.onUpdateSection(sec.id, payload)}
                                        onDelete={() => props.onDeleteSection(sec)}
                                    />
                                )}
                            />
                        )}
                    </div>
                </div>

            ) : null}
        </div>
    );
}

// Helper function to extract clean error message from API response
function getErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;

  const clean = (msg: any) => {
    const s = String(msg ?? "").trim();
    return s.startsWith("__all__:") ? s.replace(/^__all__:\s*/, "") : s;
  };

  if (data?.detail) return clean(data.detail);

  if (Array.isArray(data?.__all__) && data.__all__[0]) {
    return clean(data.__all__[0]);
  }

  if (data && typeof data === "object") {
    for (const [, value] of Object.entries(data)) {
      if (Array.isArray(value) && value[0]) return clean(value[0]);
      if (typeof value === "string") return clean(value);
    }
  }

  return fallback;
}


export function ClassroomsPage() {
    const qc = useQueryClient();

    const [status, setStatus] = React.useState<StatusFilter>("active");
    const [q, setQ] = React.useState("");
    const [debouncedQ, setDebouncedQ] = React.useState("");

    const [expandedBatches, setExpandedBatches] = React.useState<
        Record<number, boolean>
    >({});
    const [expandedClasses, setExpandedClasses] = React.useState<
        Record<string, boolean>
    >({});

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(q), 300);
        return () => clearTimeout(timer);
    }, [q]);

    // If searching: force status=all
    const effectiveStatus: StatusFilter = debouncedQ.trim() ? "all" : status;

    const [deleteTarget, setDeleteTarget] = React.useState<
        | { kind: "classroom"; item: ClassroomEntity }
        | { kind: "section"; item: SectionEntity }
        | null
    >(null);

    // ----------------
    // Queries
    // ----------------
    const batchesQuery = useQuery({
        queryKey: ["batches", "list", { status: effectiveStatus, q: debouncedQ }],
        queryFn: async () => {
            const search = debouncedQ.trim() || undefined;

            // searching => status=all
            if (search) {
                return fetchBatches({ page: 1, page_size: 100, search });
            }

            // not searching => respect dropdown
            if (status === "all") {
                return fetchBatches({ page: 1, page_size: 100 });
            }

            return fetchBatches({
                page: 1,
                page_size: 100,
                status: status as "active" | "inactive",
            });
        },
        placeholderData: keepPreviousData,
    });

    const classroomsQuery = useQuery({
        queryKey: ["classrooms", "list"],
        queryFn: async () => fetchClassrooms({}),
        placeholderData: keepPreviousData,
    });

    const sectionsQuery = useQuery({
        queryKey: ["sections", "list"],
        queryFn: async () => fetchSections({}),
        placeholderData: keepPreviousData,
    });

    const batches = batchesQuery.data?.results ?? [];
    const classroomsAll = classroomsQuery.data?.results ?? [];
    const sectionsAll = sectionsQuery.data?.results ?? [];

    // Group classrooms by batch
    const classroomsByBatch = React.useMemo(() => {
        const m = new Map<number, ClassroomEntity[]>();
        for (const c of classroomsAll) {
            if (!m.has(c.batch_id)) m.set(c.batch_id, []);
            m.get(c.batch_id)!.push(c);
        }
        for (const [, v] of m.entries()) v.sort(bySortOrder);
        return m;
    }, [classroomsAll]);

    // Group sections by class
    const sectionsByClass = React.useMemo(() => {
        const m = new Map<string, SectionEntity[]>();
        for (const s of sectionsAll) {
            if (!m.has(s.academic_class_id)) m.set(s.academic_class_id, []);
            m.get(s.academic_class_id)!.push(s);
        }
        for (const [, v] of m.entries()) v.sort(bySortOrder);
        return m;
    }, [sectionsAll]);

    // ----------------
    // Mutations
    // ----------------
    const createClassMutation = useMutation({
        mutationFn: createClassroom,
        onSuccess: async () => {
            toast.success("Class created");
            await qc.invalidateQueries({ queryKey: ["classrooms", "list"] });
        },
        onError: (e: any) =>
            toast.error(getErrorMessage(e, "Failed to create class")),
    });

    const updateClassMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) =>
            updateClassroom(id, payload),
        onSuccess: async () => {
            toast.success("Class updated");
            await qc.invalidateQueries({ queryKey: ["classrooms", "list"] });
        },
        onError: (e: any) =>
            toast.error(getErrorMessage(e, "Failed to update class")),
    });

    const deleteClassMutation = useMutation({
        mutationFn: (id: string) => deleteClassroom(id),
        onSuccess: async () => {
            toast.success("Class deleted");
            await qc.invalidateQueries({ queryKey: ["classrooms", "list"] });
            await qc.invalidateQueries({ queryKey: ["sections", "list"] });
            setDeleteTarget(null);
        },
        onError: (e: any) =>
            toast.error(getErrorMessage(e, "Failed to delete class")),
    });

    const reorderClassMutation = useMutation({
        mutationFn: reorderClassrooms,
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["classrooms", "list"] });
        },
        onError: (e: any) =>
            toast.error(getErrorMessage(e, "Failed to reorder classes")),
    });

    const createSectionMutation = useMutation({
        mutationFn: createSection,
        onSuccess: async () => {
            toast.success("Section created");
            await qc.invalidateQueries({ queryKey: ["sections", "list"] });
        },
        onError: (e: any) =>
            toast.error(getErrorMessage(e, "Failed to create section")),
    });

    const updateSectionMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) =>
            updateSection(id, payload),
        onSuccess: async () => {
            toast.success("Section updated");
            await qc.invalidateQueries({ queryKey: ["sections", "list"] });
        },
        onError: (e: any) =>
            toast.error(getErrorMessage(e, "Failed to update section")),
    });

    const deleteSectionMutation = useMutation({
        mutationFn: (id: string) => deleteSection(id),
        onSuccess: async () => {
            toast.success("Section deleted");
            await qc.invalidateQueries({ queryKey: ["sections", "list"] });
            setDeleteTarget(null);
        },
        onError: (e: any) =>
            toast.error(getErrorMessage(e, "Failed to delete section")),
    });

    const reorderSectionMutation = useMutation({
        mutationFn: reorderSections,
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["sections", "list"] });
        },
        onError: (e: any) =>
            toast.error(getErrorMessage(e, "Failed to reorder sections")),
    });

    // loading: for spinners only (do not disable search)
    const loading =
        batchesQuery.isFetching ||
        classroomsQuery.isFetching ||
        sectionsQuery.isFetching;

    // block interactions only during mutations
    const blocked =
        createClassMutation.isPending ||
        updateClassMutation.isPending ||
        deleteClassMutation.isPending ||
        reorderClassMutation.isPending ||
        createSectionMutation.isPending ||
        updateSectionMutation.isPending ||
        deleteSectionMutation.isPending ||
        reorderSectionMutation.isPending;

    const toggleBatch = (id: number) =>
        setExpandedBatches((p) => ({ ...p, [id]: !p[id] }));

    const toggleClass = (id: string) =>
        setExpandedClasses((p) => ({ ...p, [id]: !p[id] }));

    return (
        <>
            <PageShell
                title="Classrooms"
                description="Manage classes and sections per batch with drag & drop ordering."
            >
                {/* Toolbar */}
                <div className="mb-5">
                    <DataToolbar
                        loading={loading}
                        disabled={blocked}
                        search={{
                            value: q,
                            onChange: setQ,
                            placeholder: "Search batches",
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
                            onClick: () => {
                                qc.invalidateQueries({ queryKey: ["batches", "list"] });
                                qc.invalidateQueries({ queryKey: ["classrooms", "list"] });
                                qc.invalidateQueries({ queryKey: ["sections", "list"] });
                            },
                            disabled: blocked,
                            icon: <RefreshCw className="h-4 w-4" />,
                            title: "Refresh",
                        }}
                    />
                </div>

                {/* Content */}
                {batchesQuery.isError ? (
                    <div className="rounded-lg border bg-card p-4 text-sm">
                        Failed to load batches.
                    </div>
                ) : batches.length === 0 ? (
                    <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
                        No batches found.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {batches.map((batch) => {
                            const open = expandedBatches[batch.id] ?? true;
                            const batchClasses = classroomsByBatch.get(batch.id) ?? [];
                            const canEdit = batch.is_active;

                            return (
                                <div
                                    key={batch.id}
                                    className="rounded-xl border bg-card shadow-sm overflow-hidden"
                                >
                                    {/* Batch header */}
                                    <button
                                        type="button"
                                        onClick={() => toggleBatch(batch.id)}
                                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-primary/5 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-md border bg-background p-1.5">
                                                {open ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </div>

                                            <div className="flex flex-col text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-base">
                                                        {batch.name}
                                                    </span>
                                                    <Badge
                                                        variant={batch.is_active ? "active" : "inactive"}
                                                        className="text-xs"
                                                    >
                                                        {batch.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    {batch.start_date_bs} → {batch.end_date_bs}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <div className="hidden sm:flex items-center gap-1">
                                                <Layers className="h-4 w-4" />
                                                <span>{batchClasses.length} classes</span>
                                            </div>
                                            <div className="hidden sm:flex items-center gap-1">
                                                <ListOrdered className="h-4 w-4" />
                                                <span>Drag to reorder</span>
                                            </div>
                                        </div>
                                    </button>

                                    {open ? (
                                        <div className="border-t bg-background p-4">
                                            <div className="grid gap-4 lg:grid-cols-3">
                                                {/* Left: Add class / info */}
                                                <div className="lg:col-span-1">
                                                    {canEdit ? (
                                                        <NameFormCard<ClassroomCreateValues>
                                                            title="Add Class"
                                                            description="Create classes for this batch. You can drag to reorder."
                                                            blocked={blocked}
                                                            schema={classroomCreateSchema}
                                                            defaultValues={{ name: "", is_active: true }}
                                                            resetKey={`create-class-${batch.id}`}
                                                            submitLabel="Create"
                                                            submitLoading={createClassMutation.isPending}
                                                            disableSubmitUntilDirty={false}
                                                            onSubmit={async (values, methods) => {
                                                                const nextSort = batchClasses.length;
                                                                await createClassMutation.mutateAsync({
                                                                    batch_id: batch.id,
                                                                    name: values.name,
                                                                    is_active: values.is_active,
                                                                    sort_order: nextSort,
                                                                });
                                                                methods.reset({ name: "" });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="rounded-xl border bg-card p-4">
                                                            <div className="font-semibold mb-2">Read-only</div>
                                                            <p className="text-sm text-muted-foreground">
                                                                This batch is inactive. You can view classes and
                                                                sections, but cannot create, edit, delete or
                                                                reorder.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Classes */}
                                                <div className="lg:col-span-2 space-y-3">
                                                    {batchClasses.length === 0 ? (
                                                        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                                                            No classes yet.
                                                        </div>
                                                    ) : (
                                                        <SortableList<ClassroomEntity>
                                                            items={batchClasses}
                                                            disabled={!canEdit || blocked}
                                                            onReorder={(next) => {
                                                                // optimistic
                                                                qc.setQueryData(["classrooms", "list"], (old: any) => {
                                                                    if (!old?.results) return old;
                                                                    const remaining = old.results.filter(
                                                                        (x: ClassroomEntity) => x.batch_id !== batch.id
                                                                    );
                                                                    const withSort = next.map((x, i) => ({
                                                                        ...x,
                                                                        sort_order: i,
                                                                    }));
                                                                    return { ...old, results: [...remaining, ...withSort] };
                                                                });

                                                                reorderClassMutation.mutate({
                                                                    batch_id: batch.id,
                                                                    ordered_ids: next.map((x) => x.id),
                                                                });
                                                            }}
                                                            itemClassName="rounded-xl border bg-card shadow-sm"
                                                            renderItem={(cls) => (
                                                                <ClassCard
                                                                    cls={cls}
                                                                    canEdit={canEdit}
                                                                    blocked={blocked}
                                                                    open={expandedClasses[cls.id] ?? false}
                                                                    onToggle={() => toggleClass(cls.id)}
                                                                    sections={sectionsByClass.get(cls.id) ?? []}
                                                                    onUpdate={async (payload) =>
                                                                        updateClassMutation.mutateAsync({
                                                                            id: cls.id,
                                                                            payload,
                                                                        })
                                                                    }
                                                                    onDelete={() =>
                                                                        setDeleteTarget({ kind: "classroom", item: cls })
                                                                    }
                                                                    onCreateSection={async (values) => {
                                                                        const currentSections = sectionsByClass.get(cls.id) ?? [];
                                                                        await createSectionMutation.mutateAsync({
                                                                            academic_class_id: cls.id,
                                                                            name: values.name,
                                                                            is_active: true,
                                                                            sort_order: currentSections.length,
                                                                        });
                                                                    }}
                                                                    onReorderSections={(nextSections) => {
                                                                        // optimistic
                                                                        qc.setQueryData(["sections", "list"], (old: any) => {
                                                                            if (!old?.results) return old;
                                                                            const remaining = old.results.filter(
                                                                                (x: SectionEntity) =>
                                                                                    x.academic_class_id !== cls.id
                                                                            );
                                                                            const withSort = nextSections.map((x, i) => ({
                                                                                ...x,
                                                                                sort_order: i,
                                                                            }));
                                                                            return { ...old, results: [...remaining, ...withSort] };
                                                                        });

                                                                        reorderSectionMutation.mutate({
                                                                            academic_class_id: cls.id,
                                                                            ordered_ids: nextSections.map((x) => x.id),
                                                                        });
                                                                    }}
                                                                    onUpdateSection={(id, payload) =>
                                                                        updateSectionMutation.mutateAsync({ id, payload })
                                                                    }
                                                                    onDeleteSection={(sec) =>
                                                                        setDeleteTarget({ kind: "section", item: sec })
                                                                    }
                                                                />
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
            </PageShell>

            {/* Delete confirm */}
            <ConfirmDeleteDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(v) => !v && setDeleteTarget(null)}
                loading={deleteClassMutation.isPending || deleteSectionMutation.isPending}
                title={
                    deleteTarget?.kind === "classroom"
                        ? "Delete this class?"
                        : "Delete this section?"
                }
                description="This action can't be undone."
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    if (deleteTarget.kind === "classroom") {
                        await deleteClassMutation.mutateAsync(deleteTarget.item.id);
                    } else {
                        await deleteSectionMutation.mutateAsync(deleteTarget.item.id);
                    }
                }}
            />
        </>
    );
}
