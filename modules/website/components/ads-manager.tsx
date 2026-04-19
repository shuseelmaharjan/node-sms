"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import { PageShell } from "@/components/layout/PageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { AddActionButton, type AddAction } from "@/components/data-table/AddActionButton";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { Button } from "@/components/ui/button";
import { handleFormError } from "@/lib/handleFormError";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { adsColumns, type AdEntity } from "../columns/ads.columns";
import { adSchema, type AdValues } from "../schema/ads.schema";

const ADS_URL = "/api/v1/ads/";
const AD_DETAIL_URL = (id: string) => `/api/v1/ads/${id}/`;

function toOrdering(s: SortingState) {
    if (!s?.length) return "";
    return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

function getAdErrorMessage(error: any, fallback: string): string {
    const data = error?.response?.data;

    const clean = (msg: unknown) => {
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

function getDefaultValues(entity?: AdEntity | null): AdValues {
    if (!entity) {
        return {
            title: "",
            description: "",
            image_id: "",
            link_url: "",
        };
    }

    return {
        title: entity.title ?? "",
        description: entity.description ?? "",
        image_id: entity.image?.id ?? "",
        link_url: entity.link_url ?? "",
    };
}

function toPayload(values: AdValues) {
    return {
        title: values.title.trim(),
        description: values.description?.trim() || "",
        image_id: values.image_id,
        link_url: values.link_url?.trim() || "",
    };
}

export function AdsManager() {
    const qc = useQueryClient();

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [mode, setMode] = React.useState<"create" | "edit">("create");
    const [selectedId, setSelectedId] = React.useState("");
    const [deleteTarget, setDeleteTarget] = React.useState<AdEntity | null>(null);
    const [uploading, setUploading] = React.useState(false);

    const [q, setQ] = React.useState("");
    const [pageIndex, setPageIndex] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const pageSizeInitialized = React.useRef(false);

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

    const listQuery = useQuery<PaginatedResponse<AdEntity>>({
        queryKey: ["ads", "list", { pageIndex, pageSize, q, ordering }],
        queryFn: async () => {
            const params: Record<string, any> = {
                page: pageIndex + 1,
                page_size: pageSize,
            };

            if (q.trim()) params.search = q.trim();
            if (ordering) params.ordering = ordering;

            const res = await api.get<PaginatedResponse<AdEntity>>(ADS_URL, { params });
            return res.data;
        },
        placeholderData: keepPreviousData,
    });

    const detailQuery = useQuery<AdEntity>({
        queryKey: ["ads", "detail", selectedId || null],
        enabled: dialogOpen && mode === "edit" && Boolean(selectedId),
        queryFn: async () => {
            const res = await api.get<AdEntity>(AD_DETAIL_URL(selectedId));
            return res.data;
        },
    });

    React.useEffect(() => {
        const apiPageSize = listQuery.data?.meta?.page_size;
        if (!pageSizeInitialized.current && apiPageSize && apiPageSize > 0) {
            setPageSize(apiPageSize);
            pageSizeInitialized.current = true;
        }
    }, [listQuery.data?.meta?.page_size]);

    React.useEffect(() => {
        setPageIndex(0);
    }, [q, sorting]);

    const createMutation = useMutation({
        mutationFn: async (values: AdValues) => {
            const res = await api.post(ADS_URL, toPayload(values));
            return res.data;
        },
        onSuccess: async () => {
            toast.success("Ad created");
            setDialogOpen(false);
            await qc.invalidateQueries({ queryKey: ["ads", "list"] });
        },
        onError: (error: any) => {
            toast.error(getAdErrorMessage(error, "Failed to create ad"));
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (values: AdValues) => {
            const res = await api.put(AD_DETAIL_URL(selectedId), toPayload(values));
            return res.data;
        },
        onSuccess: async () => {
            toast.success("Ad updated");
            setDialogOpen(false);
            await qc.invalidateQueries({ queryKey: ["ads", "list"] });
            await qc.invalidateQueries({ queryKey: ["ads", "detail", selectedId] });
        },
        onError: (error: any) => {
            toast.error(getAdErrorMessage(error, "Failed to update ad"));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(AD_DETAIL_URL(id));
        },
        onSuccess: async () => {
            toast.success("Ad deleted");
            setDeleteTarget(null);
            await qc.invalidateQueries({ queryKey: ["ads", "list"] });
        },
        onError: (error: any) => {
            toast.error(getAdErrorMessage(error, "Failed to delete ad"));
        },
    });

    const rows = listQuery.data?.results ?? [];
    const pageData = listQuery.data;
    const totalCount = pageData?.count ?? 0;
    const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

    const currentEntity = detailQuery.data ?? null;

    const defaultValues = React.useMemo<AdValues>(() => {
        if (mode === "edit") return getDefaultValues(currentEntity);
        return getDefaultValues(null);
    }, [mode, currentEntity]);

    const resetKey = React.useMemo(() => {
        if (mode === "create") return "ads-create";
        return currentEntity
            ? `ads-edit-${selectedId}-${currentEntity.updated_at ?? "ready"}`
            : `ads-edit-${selectedId}-loading`;
    }, [mode, currentEntity, selectedId]);

    const blocked =
        listQuery.isFetching ||
        detailQuery.isFetching ||
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending ||
        uploading;

    const openCreate = () => {
        setMode("create");
        setSelectedId("");
        setDialogOpen(true);
    };

    const openEdit = (item: AdEntity) => {
        setMode("edit");
        setSelectedId(item.id);
        setDialogOpen(true);
    };

    const closeDialog = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setSelectedId("");
            setMode("create");
        }
    };

    const columns = React.useMemo(
        () =>
            adsColumns({
                onEdit: (row) => openEdit(row),
                onDelete: (row) => setDeleteTarget(row),
            }),
        []
    );

    const searchable = pageData?.meta?.searchable ?? ["title", "description", "link_url"];
    const searchEnabled = true;

    const addAction: AddAction = {
        kind: "modal",
        label: "Add Ads",
        onClick: openCreate,
    };

    const handleRefresh = () => {
        setQ("");
        setSorting([]);
        setPageIndex(0);
    };

    return (
        <>
            <PageShell title="Ads" description="Manage website ads.">
                <DataTable<AdEntity>
                    data={rows}
                    columns={columns}
                    loading={listQuery.isLoading}
                    emptyText={listQuery.isError ? "Failed to load." : "No records yet."}
                    sorting={sorting}
                    onSortingChange={setSorting}
                    pagination={{
                        pageIndex,
                        pageSize,
                        pageCount,
                        totalCount,
                        currentPage: pageData?.meta?.page,
                        onPageChange: setPageIndex,
                        onPageSizeChange: (n) => {
                            pageSizeInitialized.current = true;
                            setPageSize(n);
                            setPageIndex(0);
                        },
                    }}
                    meta={{
                        searchable,
                        search_param: pageData?.meta?.search_param ?? "search",
                    }}
                    toolbar={{
                        search: {
                            value: q,
                            onChange: setQ,
                            enabled: searchEnabled,
                            placeholder: "Search ads",
                        },
                        actions: <AddActionButton add={addAction} />,
                    }}
                    refresh={{
                        onClick: handleRefresh,
                        disabled: blocked,
                        icon: <RefreshCw className="h-4 w-4" />,
                        title: "Refresh list",
                    }}
                />
            </PageShell>

            <Dialog open={dialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{mode === "create" ? "Add Ad" : "Update Ad"}</DialogTitle>
                        <DialogDescription>
                            {mode === "create"
                                ? "Create a new ad for the website."
                                : "Update the ad details."}
                        </DialogDescription>
                    </DialogHeader>

                    <FormWizard
                        schema={adSchema}
                        defaultValues={defaultValues}
                        resetKey={resetKey}
                        blocked={blocked}
                        externallyBlocked={uploading}
                        submitLabel={mode === "create" ? "Create" : "Update"}
                        submitLoading={createMutation.isPending || updateMutation.isPending}
                        disableSubmitUntilDirty={mode === "edit"}
                        onCancel={() => closeDialog(false)}
                        onSubmit={async (values, methods) => {
                            try {
                                if (mode === "create") await createMutation.mutateAsync(values);
                                else await updateMutation.mutateAsync(values);
                            } catch (error) {
                                handleFormError(error, { setError: methods.setError });
                            }
                        }}
                        render={(methods) => {
                            const imageInitialUri =
                                mode === "edit" ? currentEntity?.image?.file_url ?? null : null;

                            return (
                                <div className="grid gap-6 lg:grid-cols-3">
                                    <div className="space-y-6 lg:col-span-2">
                                        <InputField
                                            label="Title"
                                            required
                                            placeholder="Enter ad title"
                                            disabled={blocked}
                                            {...methods.register("title")}
                                            error={methods.formState.errors.title as any}
                                        />

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Description</label>
                                            <textarea
                                                rows={8}
                                                placeholder="Write ad description..."
                                                disabled={blocked}
                                                className="flex min-h-[180px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                {...methods.register("description")}
                                            />
                                            {methods.formState.errors.description ? (
                                                <p className="text-sm text-destructive">
                                                    {methods.formState.errors.description.message as any}
                                                </p>
                                            ) : null}
                                        </div>

                                        <InputField
                                            label="Link URL"
                                            placeholder="https://example.com"
                                            disabled={blocked}
                                            {...methods.register("link_url")}
                                            error={methods.formState.errors.link_url as any}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <Controller
                                            control={methods.control}
                                            name="image_id"
                                            render={({ field, fieldState }) => (
                                                <ImagePickerField
                                                    title="Ad Image"
                                                    required
                                                    hint="PNG, JPG up to ~5MB"
                                                    value={field.value}
                                                    initialUri={imageInitialUri}
                                                    onChange={(value) => field.onChange(value || "")}
                                                    error={fieldState.error}
                                                    onUploadStatusChange={setUploading}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            );
                        }}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(v) => !v && setDeleteTarget(null)}
                loading={deleteMutation.isPending}
                title="Delete this ad?"
                description="This action can’t be undone."
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    await deleteMutation.mutateAsync(deleteTarget.id);
                }}
            />
        </>
    );
}