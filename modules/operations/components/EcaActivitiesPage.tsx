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
import { ecaActivityColumns, type EcaActivityEntity } from "../columns/ecaActivity.columns";
import { EcaActivityFormModal } from "./ecaActivity-form-modal";

const LIST_URL = "/api/v1/eca/activities/";
const DETAIL_URL = (id: string) => `/api/v1/eca/activities/${id}/`;

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function EcaActivitiesPage() {
  const qc = useQueryClient();

  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("active");

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [sorting, setSorting] = React.useState<SortingState>([{ id: "created_at", desc: true }]);
  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EcaActivityEntity | null>(null);

  const listQuery = useQuery<PaginatedResponse<EcaActivityEntity>>({
    queryKey: ["eca-activities", "list", { pageIndex, pageSize, q, ordering, statusFilter }],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<EcaActivityEntity>>(LIST_URL, {
        params: {
          page: pageIndex + 1,
          page_size: pageSize,
          search: q || undefined,
          ordering: ordering || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  React.useEffect(() => {
    setPageIndex(0);
  }, [q, statusFilter, sorting]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(DETAIL_URL(id));
    },
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["eca-activities", "list"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to delete activity"),
  });

  const blocked = listQuery.isFetching || deleteMutation.isPending;

  const pageData = listQuery.data;
  const rows = pageData?.results ?? [];
  const totalCount = pageData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const meta = (pageData as any)?.meta ?? {
    searchable: ["name", "description"],
    search_param: "search",
  };

  const columns = React.useMemo(
    () =>
      ecaActivityColumns({
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
    label: "Add Activity",
    onClick: () => {
      setEditId(null);
      setOpen(true);
    },
  };

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "archived", label: "Archived" },
    { value: "deleted", label: "Deleted" },
  ];

  return (
    <>
      <PageShell title="Operations" description="Manage extracurricular activities for your school.">
        <DataTable<EcaActivityEntity>
          data={rows}
          columns={columns}
          loading={listQuery.isLoading}
          emptyText={listQuery.isError ? "Failed to load." : "No activities yet."}
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
              placeholder: "Search activities",
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
            },
            actions: <AddActionButton add={addAction} />,
          }}
          refresh={{
            onClick: () => qc.invalidateQueries({ queryKey: ["eca-activities", "list"] }),
            disabled: blocked,
            icon: <RefreshCw className="h-4 w-4" />,
            title: "Refresh list",
          }}
        />
      </PageShell>

      <EcaActivityFormModal
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
        title="Delete this activity?"
        description="This action can't be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
