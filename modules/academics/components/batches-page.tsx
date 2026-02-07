// modules/academics/components/batches-page.tsx
"use client";

import * as React from "react";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { RefreshCw, Filter } from "lucide-react";

import { api } from "@/api";
import { DataTable } from "@/components/data-table/DataTable";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { PageShell } from "@/components/layout/PageShell";
import { AddActionButton, type AddAction } from "@/components/data-table/AddActionButton";

import type { PaginatedResponse } from "@/types/api";
import { batchColumns, type BatchEntity } from "../columns/batch.columns";
import { BatchFormModal } from "./batch-form-modal";

const LIST_URL = "/api/v1/batches/";
const DETAIL_URL = (id: number) => `/api/v1/batches/${id}/`;

// Date validation utilities for page actions
const getCurrentDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
    ).padStart(2, "0")}`;
};

const isDateInFuture = (dateAd: string) => {
    if (!dateAd) return false;
    const currentDate = getCurrentDate();
    return dateAd > currentDate;
};

const canDeleteBatch = (batch: BatchEntity) => {
    const startInFuture = isDateInFuture(batch.start_date_ad);
    return startInFuture; // Only allow deletion for future batches
};

function toOrdering(s: SortingState) {
    if (!s?.length) return "";
    return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function BatchesPage() {
    const qc = useQueryClient();

    const [q, setQ] = React.useState("");
    const [activeFilter, setActiveFilter] = React.useState<string>("active"); // all|active|inactive

    const [pageIndex, setPageIndex] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);

    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "name", desc: false },
    ]);
    const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

    const [open, setOpen] = React.useState(false);
    const [editId, setEditId] = React.useState<number | null>(null);

    const [deleteTarget, setDeleteTarget] = React.useState<BatchEntity | null>(null);

    const listQuery = useQuery<PaginatedResponse<BatchEntity>>({
        queryKey: ["batches", "list", { pageIndex, pageSize, q, ordering, activeFilter }],
        queryFn: async () => {
            const res = await api.get<PaginatedResponse<BatchEntity>>(LIST_URL, {
                params: {
                    page: pageIndex + 1,
                    page_size: pageSize,
                    search: q || undefined,
                    ordering: ordering || undefined,

                    status: activeFilter === "all" ? undefined : activeFilter,
                },
            });
            return res.data;
        },
        placeholderData: keepPreviousData,
    });


    React.useEffect(() => {
        setPageIndex(0);
    }, [q, activeFilter, sorting]);

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(DETAIL_URL(id));
        },
        onSuccess: async () => {
            toast.success("Deleted");
            await qc.invalidateQueries({ queryKey: ["batches", "list"] });
            setDeleteTarget(null);
        },
        onError: (e: any) =>
            toast.error(e?.response?.data?.detail ?? "Failed to delete batch"),
    });

    const blocked = listQuery.isFetching || deleteMutation.isPending;

    const pageData = listQuery.data;
    const rows = pageData?.results ?? [];
    const totalCount = pageData?.count ?? 0;
    const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

    // force DataTable search to show (even if API doesn't return meta)
    const meta = (pageData as any)?.meta ?? {
        searchable: ["name", "start_date_bs", "end_date_bs"],
        search_param: "search",
    };

    const columns = React.useMemo(
        () =>
            batchColumns({
                onEdit: (row) => {
                    setEditId(row.id);
                    setOpen(true);
                },
                onDelete: (row) => setDeleteTarget(row),
            }),
        []
    );

    const addAction: AddAction = {
        kind: "modal",
        label: "Add Batch",
        onClick: () => {
            setEditId(null);
            setOpen(true);
        },
    };

    return (
        <>
            <PageShell title="Batches" description="Manage academic batches.">
                <DataTable<BatchEntity>
                    data={rows}
                    columns={columns}
                    loading={listQuery.isLoading}
                    emptyText={listQuery.isError ? "Failed to load." : "No batches yet."}
                    sorting={sorting}
                    onSortingChange={setSorting}
                    pagination={{
                        pageIndex,
                        pageSize,
                        pageCount,
                        totalCount,
                        currentPage: (pageData as any)?.meta?.page,
                        onPageChange: setPageIndex,
                        onPageSizeChange: (n) => {
                            setPageSize(n);
                            setPageIndex(0);
                        },
                    }}
                    meta={meta}
                    toolbar={{
                        search: {
                            value: q,
                            onChange: setQ,
                            enabled: true,
                            placeholder: "Search batches",
                        },
                        filters: {
                            active_filter: {
                                value: activeFilter,
                                onChange: setActiveFilter,
                                options: [
                                    { value: "all", label: "All" },
                                    { value: "active", label: "Active" },
                                    { value: "inactive", label: "Inactive" },
                                ],
                                placeholder: "Filter status",
                                label: "Status",
                                icon: <Filter className="h-4 w-4" />,
                            },
                        },
                        actions: <AddActionButton add={addAction} />,
                    }}
                    refresh={{
                        onClick: () => qc.invalidateQueries({ queryKey: ["batches", "list"] }),
                        disabled: blocked,
                        icon: <RefreshCw className="h-4 w-4" />,
                        title: "Refresh list",
                    }}
                />
            </PageShell>

            <BatchFormModal
                open={open}
                onOpenChange={(v) => {
                    setOpen(v);
                    if (!v) setEditId(null);
                }}
                editId={editId}
            />

            <ConfirmDeleteDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(v) => !v && setDeleteTarget(null)}
                loading={deleteMutation.isPending}
                title="Delete this batch?"
                description={deleteTarget && !canDeleteBatch(deleteTarget) 
                    ? "Cannot delete this batch. Only future batches can be deleted."
                    : "This action can't be undone."
                }
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    if (!canDeleteBatch(deleteTarget)) {
                        toast.error("Cannot delete this batch. Only future batches can be deleted.");
                        return;
                    }
                    await deleteMutation.mutateAsync(deleteTarget.id);
                }}
                confirmDisabled={deleteTarget ? !canDeleteBatch(deleteTarget) : false}
            />
        </>
    );
}
