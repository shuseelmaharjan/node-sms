"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import { PageShell } from "@/components/layout/PageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { AddActionButton, type AddAction } from "@/components/data-table/AddActionButton";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { TextareaField } from "@/components/fields/TextareaField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { handleFormError } from "@/lib/handleFormError";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    testimonialsColumns,
    type TestimonialEntity,
} from "../columns/testimonials.columns";
import {
    testimonialSchema,
    type TestimonialValues,
} from "../schema/testimonials.schema";

const URL = "/api/v1/testimonials/";
const DETAIL = (id: string) => `/api/v1/testimonials/${id}/`;

function toOrdering(s: SortingState) {
    if (!s?.length) return "";
    return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

function getDefault(entity?: TestimonialEntity | null): TestimonialValues {
    return {
        name: entity?.name ?? "",
        role: entity?.role ?? "",
        message: entity?.message ?? "",
        image_id: entity?.image?.id ?? "",
    };
}

function toPayload(v: TestimonialValues) {
    return {
        name: v.name.trim(),
        role: v.role.trim(),
        message: v.message.trim(),
        image_id: v.image_id,
    };
}

function getErrorMessage(error: any, fallback: string) {
    const data = error?.response?.data;

    if (typeof data?.detail === "string") return data.detail;

    if (data && typeof data === "object") {
        for (const value of Object.values(data)) {
            if (Array.isArray(value) && value[0]) return String(value[0]);
            if (typeof value === "string") return value;
        }
    }

    return fallback;
}

export function TestimonialsManager() {
    const qc = useQueryClient();

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [mode, setMode] = React.useState<"create" | "edit">("create");
    const [selectedId, setSelectedId] = React.useState("");
    const [deleteTarget, setDeleteTarget] = React.useState<TestimonialEntity | null>(null);
    const [uploading, setUploading] = React.useState(false);

    const [q, setQ] = React.useState("");
    const [pageIndex, setPageIndex] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

    const listQuery = useQuery({
        queryKey: ["testimonials", pageIndex, pageSize, q, ordering],
        queryFn: async () => {
            const res = await api.get<PaginatedResponse<TestimonialEntity>>(URL, {
                params: {
                    page: pageIndex + 1,
                    page_size: pageSize,
                    search: q || undefined,
                    ordering: ordering || undefined,
                },
            });
            return res.data;
        },
        placeholderData: keepPreviousData,
    });

    const detailQuery = useQuery({
        queryKey: ["testimonial", selectedId],
        enabled: dialogOpen && mode === "edit" && Boolean(selectedId),
        queryFn: async () => {
            const res = await api.get<TestimonialEntity>(DETAIL(selectedId));
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (v: TestimonialValues) => {
            const res = await api.post(URL, toPayload(v));
            return res.data;
        },
        onSuccess: async () => {
            toast.success("Testimonial created");
            setDialogOpen(false);
            await qc.invalidateQueries({ queryKey: ["testimonials"] });
        },
        onError: (e: any) => {
            toast.error(getErrorMessage(e, "Failed to create testimonial"));
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (v: TestimonialValues) => {
            const res = await api.put(DETAIL(selectedId), toPayload(v));
            return res.data;
        },
        onSuccess: async () => {
            toast.success("Testimonial updated");
            setDialogOpen(false);
            await qc.invalidateQueries({ queryKey: ["testimonials"] });
            await qc.invalidateQueries({ queryKey: ["testimonial", selectedId] });
        },
        onError: (e: any) => {
            toast.error(getErrorMessage(e, "Failed to update testimonial"));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(DETAIL(id));
        },
        onSuccess: async () => {
            toast.success("Testimonial deleted");
            setDeleteTarget(null);
            await qc.invalidateQueries({ queryKey: ["testimonials"] });
        },
        onError: (e: any) => {
            toast.error(getErrorMessage(e, "Failed to delete testimonial"));
        },
    });

    const rows = listQuery.data?.results ?? [];
    const pageData = listQuery.data;

    const currentEntity = detailQuery.data ?? null;

    const defaultValues = React.useMemo<TestimonialValues>(() => {
        if (mode === "edit") return getDefault(currentEntity);
        return getDefault(null);
    }, [mode, currentEntity]);

    const resetKey = React.useMemo(() => {
        if (mode === "create") return "testimonial-create";

        if (!currentEntity) return "testimonial-edit-loading";

        return `testimonial-edit-${selectedId}-${currentEntity.updated_at ?? "ready"}`;
    }, [mode, selectedId, currentEntity?.updated_at]);

    const blocked =
        listQuery.isFetching ||
        detailQuery.isFetching ||
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending ||
        uploading;

    const columns = React.useMemo(
        () =>
            testimonialsColumns({
                onEdit: (row: TestimonialEntity) => {
                    setMode("edit");
                    setSelectedId(row.id);
                    setDialogOpen(true);
                },
                onDelete: (row: TestimonialEntity) => setDeleteTarget(row),
            }),
        []
    );

    const addAction: AddAction = {
        kind: "modal",
        label: "Add Testimonial",
        onClick: () => {
            setMode("create");
            setSelectedId("");
            setDialogOpen(true);
        },
    };

    return (
        <>
            <PageShell title="Testimonials" description="Manage testimonials">
                <DataTable<TestimonialEntity>
                    data={rows}
                    columns={columns}
                    loading={listQuery.isLoading}
                    sorting={sorting}
                    onSortingChange={setSorting}
                    pagination={{
                        pageIndex,
                        pageSize,
                        pageCount: Math.max(1, Math.ceil((pageData?.count ?? 0) / pageSize)),
                        totalCount: pageData?.count ?? 0,
                        onPageChange: setPageIndex,
                        onPageSizeChange: setPageSize,
                    }}
                    toolbar={{
                        search: {
                            value: q,
                            onChange: setQ,
                            enabled: true,
                            placeholder: "Search testimonials",
                        },
                        actions: <AddActionButton add={addAction} />,
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

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        setSelectedId("");
                        setMode("create");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {mode === "create" ? "Add" : "Edit"} Testimonial
                        </DialogTitle>
                    </DialogHeader>

                    <FormWizard
                        schema={testimonialSchema}
                        defaultValues={defaultValues}
                        resetKey={resetKey}
                        blocked={blocked}
                        externallyBlocked={uploading}
                        submitLabel={mode === "create" ? "Create" : "Update"}
                        submitLoading={createMutation.isPending || updateMutation.isPending}
                        disableSubmitUntilDirty={mode === "edit"}
                        onSubmit={async (v, m) => {
                            try {
                                if (mode === "create") {
                                    await createMutation.mutateAsync(v);
                                } else {
                                    await updateMutation.mutateAsync(v);
                                }
                            } catch (e) {
                                handleFormError(e, { setError: m.setError });
                            }
                        }}
                        render={(methods) => {
                            const imageInitialUri =
                                mode === "edit" ? currentEntity?.image?.file_url ?? null : null;

                            return (
                                <div className="space-y-4">
                                    <InputField
                                        label="Name"
                                        required
                                        placeholder="Enter name"
                                        {...methods.register("name")}
                                        error={methods.formState.errors.name as any}
                                    />

                                    <InputField
                                        label="Role"
                                        required
                                        placeholder="Enter role"
                                        {...methods.register("role")}
                                        error={methods.formState.errors.role as any}
                                    />

                                    <Controller
                                        control={methods.control}
                                        name="message"
                                        render={({ field, fieldState }) => (
                                            <TextareaField
                                                label="Message"
                                                placeholder="Write testimonial message..."
                                                rows={5}
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                name={field.name}
                                                ref={field.ref}
                                                error={fieldState.error}
                                            />
                                        )}
                                    />

                                    <Controller
                                        control={methods.control}
                                        name="image_id"
                                        render={({ field, fieldState }) => (
                                            <ImagePickerField
                                                title="Image"
                                                required
                                                value={field.value}
                                                initialUri={imageInitialUri}
                                                onChange={(v) => field.onChange(v || "")}
                                                error={fieldState.error}
                                                onUploadStatusChange={setUploading}
                                            />
                                        )}
                                    />
                                </div>
                            );
                        }}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                loading={deleteMutation.isPending}
                title="Delete testimonial?"
                description="This action can’t be undone."
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    await deleteMutation.mutateAsync(deleteTarget.id);
                }}
            />
        </>
    );
}