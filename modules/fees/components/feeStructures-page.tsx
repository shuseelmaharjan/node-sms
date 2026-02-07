"use client";

import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { RefreshCw, Filter } from "lucide-react";

import { api } from "@/api";
import { DataTable } from "@/components/data-table/DataTable";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { PageShell } from "@/components/layout/PageShell";
import { AddActionButton, type AddAction } from "@/components/data-table/AddActionButton";

import type { PaginatedResponse } from "@/types/api";
import { feeStructureColumns, type FeeStructureEntity } from "../columns/feeStructure.columns";
import { FeeStructureFormModal } from "./feeStructure-form-modal";

const LIST_URL = "/api/v1/fees/fee-structures/";
const DETAIL_URL = (id: string) => `/api/v1/fees/fee-structures/${id}/`;

// helpers for ordering param
function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function FeeStructuresPage() {
  const qc = useQueryClient();

  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("active");
  const [scopeFilter, setScopeFilter] = React.useState<string>("all");
  const [periodFilter, setPeriodFilter] = React.useState<string>("all");

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [sorting, setSorting] = React.useState<SortingState>([{ id: "created_at", desc: true }]);
  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<FeeStructureEntity | null>(null);

  const listQuery = useQuery<PaginatedResponse<FeeStructureEntity>>({
    queryKey: ["fee-structures", "list", { pageIndex, pageSize, q, ordering, statusFilter, scopeFilter, periodFilter }],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<FeeStructureEntity>>(LIST_URL, {
        params: {
          page: pageIndex + 1,
          page_size: pageSize,
          search: q || undefined,
          ordering: ordering || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          scope: scopeFilter === "all" ? undefined : scopeFilter,
          period: periodFilter === "all" ? undefined : periodFilter,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  React.useEffect(() => {
    setPageIndex(0);
  }, [q, statusFilter, scopeFilter, periodFilter, sorting]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(DETAIL_URL(id));
    },
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["fee-structures", "list"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to delete fee structure"),
  });

  const blocked = listQuery.isFetching || deleteMutation.isPending;

  const pageData = listQuery.data;
  const rows = pageData?.results ?? [];
  const totalCount = pageData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const meta = (pageData as any)?.meta ?? {
    searchable: ["fee_head__name", "fee_head__code"],
    search_param: "search",
  };

  const columns = React.useMemo(
    () =>
      feeStructureColumns({
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
    label: "Add Fee Structure",
    onClick: () => {
      setEditId(null);
      setOpen(true);
    },
  };

  // filter options
  const statusOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "archived", label: "Archived" },
    { value: "expired", label: "Expired" },
    { value: "deleted", label: "Deleted" },
  ];

  const scopeOptions = [
    { value: "all", label: "All" },
    { value: "GLOBAL", label: "Global" },
    // { value: "BATCH", label: "BATCH" },
    // { value: "CLASS", label: "CLASS" },
    { value: "BATCH_CLASS", label: "Specific" },
  ];

  const periodOptions = [
    { value: "all", label: "All" },
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "SEMESTER", label: "Semester" },
    { value: "ANNUAL", label: "Annual" },
    { value: "ONE_TIME", label: "One Time" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <>
      <PageShell title="Fee Structures" description="Configure fee amounts per scope and period.">
        <DataTable<FeeStructureEntity>
          data={rows}
          columns={columns}
          loading={listQuery.isLoading}
          emptyText={listQuery.isError ? "Failed to load." : "No fee structures yet."}
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
              placeholder: "Search fee structures",
            },
            filters: {
              status: {
                value: statusFilter,
                onChange: setStatusFilter,
                options: statusOptions,
                placeholder: "Filter status",
                label: "Status",
                icon: <Filter className="h-4 w-4" />,
              },
              scope: {
                value: scopeFilter,
                onChange: setScopeFilter,
                options: scopeOptions,
                placeholder: "Filter scope",
                label: "Scope",
                icon: <Filter className="h-4 w-4" />,
              },
              period: {
                value: periodFilter,
                onChange: setPeriodFilter,
                options: periodOptions,
                placeholder: "Filter period",
                label: "Period",
                icon: <Filter className="h-4 w-4" />,
              },
            },
            actions: <AddActionButton add={addAction} />,
          }}
          refresh={{
            onClick: () => qc.invalidateQueries({ queryKey: ["fee-structures", "list"] }),
            disabled: blocked,
            icon: <RefreshCw className="h-4 w-4" />,
            title: "Refresh list",
          }}
        />
      </PageShell>

      <FeeStructureFormModal
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
        title="Delete this fee structure?"
        description="This action can't be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
