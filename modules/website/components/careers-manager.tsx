"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";

import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import { PageShell } from "@/components/layout/PageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { AddActionButton } from "@/components/data-table/AddActionButton";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { RichTextEditor } from "@/components/fields/RichTextEditor";
import { handleFormError } from "@/lib/handleFormError";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    careersColumns,
    type CareerEntity,
} from "../columns/careers.columns";
import {
    careerSchema,
    type CareerValues,
} from "../schema/careers.schema";

const URL = "/api/v1/careers/";
const DETAIL = (id: string) => `/api/v1/careers/${id}/`;

function empty(): JSONContent {
    return { type: "doc", content: [{ type: "paragraph" }] };
}

function parse(v?: string | null): JSONContent {
    if (!v) return empty();
    try {
        return JSON.parse(v);
    } catch {
        return empty();
    }
}

function toPayload(v: CareerValues) {
    return {
        title: v.title.trim(),
        position: v.position.trim(),
        job_description: JSON.stringify(v.job_description ?? empty()),
        requirements: JSON.stringify(v.requirements ?? empty()),
        expires_at: v.expires_at,
    };
}

function getDefault(e?: CareerEntity | null): CareerValues {
    return {
        title: e?.title ?? "",
        position: e?.position ?? "",
        job_description: parse((e as any)?.job_description),
        requirements: parse((e as any)?.requirements),
        expires_at: e?.expires_at ?? "",
    };
}

export function CareersManager() {
    const qc = useQueryClient();

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [mode, setMode] = React.useState<"create" | "edit">("create");
    const [selectedId, setSelectedId] = React.useState("");
    const [deleteTarget, setDeleteTarget] = React.useState<CareerEntity | null>(null);

    const [q, setQ] = React.useState("");
    const [pageIndex, setPageIndex] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const ordering = sorting.map(s => (s.desc ? `-${s.id}` : s.id)).join(",");

    const listQuery = useQuery({
        queryKey: ["careers", pageIndex, pageSize, q, ordering],
        queryFn: async () => {
            const res = await api.get<PaginatedResponse<CareerEntity>>(URL, {
                params: {
                    page: pageIndex + 1,
                    page_size: pageSize,
                    search: q,
                    ordering,
                },
            });
            return res.data;
        },
        placeholderData: keepPreviousData,
    });

    const detailQuery = useQuery({
        queryKey: ["career", selectedId],
        enabled: dialogOpen && mode === "edit",
        queryFn: async () => {
            const res = await api.get<CareerEntity>(DETAIL(selectedId));
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (v: CareerValues) =>
            api.post(URL, toPayload(v)),
        onSuccess: () => {
            toast.success("Created");
            setDialogOpen(false);
            qc.invalidateQueries({ queryKey: ["careers"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (v: CareerValues) =>
            api.put(DETAIL(selectedId), toPayload(v)),
        onSuccess: () => {
            toast.success("Updated");
            setDialogOpen(false);
            qc.invalidateQueries({ queryKey: ["careers"] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(DETAIL(id)),
        onSuccess: () => {
            toast.success("Deleted");
            setDeleteTarget(null);
            qc.invalidateQueries({ queryKey: ["careers"] });
        },
    });

    const rows = listQuery.data?.results ?? [];
    const current = detailQuery.data ?? null;

    const defaultValues = React.useMemo(
        () => (mode === "edit" ? getDefault(current) : getDefault()),
        [mode, current]
    );

    const columns = React.useMemo(
        () =>
            careersColumns({
                onEdit: (row) => {
                    setMode("edit");
                    setSelectedId(row.id);
                    setDialogOpen(true);
                },
                onDelete: (row) => setDeleteTarget(row),
            }),
        []
    );

    return (
        <>
            <PageShell title="Careers" description="Manage job postings">
                <DataTable
                    data={rows}
                    columns={columns}
                    loading={listQuery.isLoading}
                    sorting={sorting}
                    onSortingChange={setSorting}
                    pagination={{
                        pageIndex,
                        pageSize,
                        pageCount: Math.ceil((listQuery.data?.count ?? 0) / pageSize),
                        totalCount: listQuery.data?.count ?? 0,
                        onPageChange: setPageIndex,
                        onPageSizeChange: setPageSize,
                    }}
                    toolbar={{
                        search: {
                            value: q,
                            onChange: setQ,
                            enabled: true,
                            placeholder: "Search jobs",
                        },
                        actions: (
                            <AddActionButton
                                add={{
                                    kind: "modal",
                                    label: "Add Job",
                                    onClick: () => {
                                        setMode("create");
                                        setDialogOpen(true);
                                    },
                                }}
                            />
                        ),
                    }}
                    refresh={{
                        onClick: () => {
                            setQ("");
                            setSorting([]);
                            setPageIndex(0);
                        },
                        icon: <RefreshCw className="h-4 w-4" />,
                    }}
                />
            </PageShell>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>
                            {mode === "create" ? "Add" : "Edit"} Job
                        </DialogTitle>
                    </DialogHeader>

                    <FormWizard
                        schema={careerSchema}
                        defaultValues={defaultValues}
                        onSubmit={async (v, m) => {
                            try {
                                if (mode === "create") await createMutation.mutateAsync(v);
                                else await updateMutation.mutateAsync(v);
                            } catch (e) {
                                handleFormError(e, { setError: m.setError });
                            }
                        }}
                        render={(methods) => (
                            <div className="space-y-6">
                                <InputField label="Title" {...methods.register("title")} placeholder="Enter job title" required/>
                                <InputField label="Position" {...methods.register("position")} placeholder="Enter job position"  required/>

                                <Controller
                                    control={methods.control}
                                    name="job_description"
                                    render={({ field }) => (
                                        <RichTextEditor
                                            label="Job Description"
                                            value={field.value}
                                            onChange={field.onChange}
                                            required
                                        />
                                    )}
                                />

                                <Controller
                                    control={methods.control}
                                    name="requirements"
                                    render={({ field }) => (
                                        <RichTextEditor
                                            label="Requirements"
                                            value={field.value}
                                            onChange={field.onChange}
                                            required
                                        />
                                    )}
                                />

                                <InputField
                                    label="Expires At"
                                    type="datetime-local"
                                    {...methods.register("expires_at")}
                                    required
                                />
                            </div>
                        )}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    await deleteMutation.mutateAsync(deleteTarget.id);
                }}
            />
        </>
    );
}