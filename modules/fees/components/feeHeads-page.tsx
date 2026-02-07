// modules/fees/components/feeHeads-page.tsx
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
import { feeHeadColumns, type FeeHeadEntity } from "../columns/feeHead.columns";
import { FeeHeadFormModal } from "./feeHead-form-modal";

const LIST_URL = "/api/v1/fees/fee-heads/";
const DETAIL_URL = (id: string) => `/api/v1/fees/fee-heads/${id}/`;

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function FeeHeadsPage() {
  const qc = useQueryClient();

  const [q, setQ] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<string>("active"); // all|true|false (we map below)
  const [groupFilter, setGroupFilter] = React.useState<string>("all"); // all => all groups

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [sorting, setSorting] = React.useState<SortingState>([{ id: "name", desc: false }]);
  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = React.useState<FeeHeadEntity | null>(null);

  const listQuery = useQuery<PaginatedResponse<FeeHeadEntity>>({
    queryKey: ["fee-heads", "list", { pageIndex, pageSize, q, ordering, activeFilter, groupFilter }],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<FeeHeadEntity>>(LIST_URL, {
        params: {
          page: pageIndex + 1,
          page_size: pageSize,
          search: q || undefined,
          ordering: ordering || undefined,
          is_active:
            activeFilter === "all" ? undefined : activeFilter === "active" ? "true" : "false",
          group: groupFilter === "all" ? undefined : groupFilter,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  React.useEffect(() => {
    setPageIndex(0);
  }, [q, activeFilter, groupFilter, sorting]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(DETAIL_URL(id));
    },
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["fee-heads", "list"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to delete fee head"),
  });

  const blocked = listQuery.isFetching || deleteMutation.isPending;

  const pageData = listQuery.data;
  const rows = pageData?.results ?? [];
  const totalCount = pageData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  // Use backend meta if provided, else fallback
  const meta = (pageData as any)?.meta ?? {
    searchable: ["name", "code", "description"],
    search_param: "search",
  };

  const columns = React.useMemo(
    () =>
      feeHeadColumns({
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
    label: "Add Fee Head",
    onClick: () => {
      setEditId(null);
      setOpen(true);
    },
  };

  // You can optionally generate group options from meta.filterable.group if backend sends choices later.
  const groupOptions = [
    { value: "all", label: "All" },
    { value: "ONE_TIME", label: "ONE_TIME" },
    { value: "MONTHLY", label: "MONTHLY" },
    { value: "ANNUAL", label: "ANNUAL" },
  ];

  return (
    <>
      <PageShell title="Fee Heads" description="Manage fee heads.">
        <DataTable<FeeHeadEntity>
          data={rows}
          columns={columns}
          loading={listQuery.isLoading}
          emptyText={listQuery.isError ? "Failed to load." : "No fee heads yet."}
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
              placeholder: "Search fee heads",
            },
            filters: {
              is_active: {
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
              group: {
                value: groupFilter,
                onChange: setGroupFilter,
                options: groupOptions,
                placeholder: "Filter group",
                label: "Group",
                icon: <Filter className="h-4 w-4" />,
              },
            },
            actions: <AddActionButton add={addAction} />,
          }}
          refresh={{
            onClick: () => qc.invalidateQueries({ queryKey: ["fee-heads", "list"] }),
            disabled: blocked,
            icon: <RefreshCw className="h-4 w-4" />,
            title: "Refresh list",
          }}
        />
      </PageShell>

      <FeeHeadFormModal
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
        title="Delete this fee head?"
        description="This action can't be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
