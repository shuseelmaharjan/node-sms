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

import { teacherLevelColumns, type TeacherLevelEntity } from "../columns/teacher-level.columns";
import { TeacherLevelFormModal } from "./teacherLevel-form-modal.tsx";

const LIST_URL = "/api/v1/teacher-levels/";
const DETAIL_URL = (id: string) => `/api/v1/teacher-levels/${id}/`;

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function TeacherLevelsPage() {
  const qc = useQueryClient();

  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all"); // all|active|inactive
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [sorting, setSorting] = React.useState<SortingState>([{ id: "level", desc: false }]);
  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TeacherLevelEntity | null>(null);

  const listQuery = useQuery<PaginatedResponse<TeacherLevelEntity>>({
    queryKey: ["teacher-levels", "list", { pageIndex, pageSize, q, ordering, statusFilter }],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<TeacherLevelEntity>>(LIST_URL, {
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
  }, [q, sorting, statusFilter]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(DETAIL_URL(id));
    },
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["teacher-levels", "list"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to delete teacher level"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, nextActive }: { id: string; nextActive: boolean }) => {
      // no custom endpoint needed; patch status directly
      const res = await api.patch(DETAIL_URL(id), { status: nextActive ? "active" : "inactive" });
      return (res.data as any)?.data ?? res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teacher-levels", "list"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to update status"),
  });

  const blocked = listQuery.isFetching || deleteMutation.isPending || toggleStatusMutation.isPending;

  const pageData = listQuery.data;
  const rowsRaw = pageData?.results ?? [];
  const rows = rowsRaw.map((r, i) => ({ ...r, serial: pageIndex * pageSize + i + 1 }));

  const totalCount = pageData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const meta = (pageData as any)?.meta ?? {
    searchable: ["level"],
    search_param: "search",
  };

  const columns = React.useMemo(
    () =>
      teacherLevelColumns({
        blocked,
        onEdit: (row) => {
          setEditId(row.id);
          setOpen(true);
        },
        onDelete: (row) => setDeleteTarget(row),
        onToggle: (row, nextActive) => {
          // optimistic
          qc.setQueryData(
            ["teacher-levels", "list", { pageIndex, pageSize, q, ordering, statusFilter }],
            (old: any) => {
              if (!old?.results) return old;
              const nextResults = old.results.map((x: TeacherLevelEntity) =>
                x.id === row.id ? { ...x, status: nextActive ? "active" : "inactive" } : x
              );
              return { ...old, results: nextResults };
            }
          );

          toggleStatusMutation.mutate({ id: row.id, nextActive });
        },
      }),
    [blocked, qc, pageIndex, pageSize, q, ordering, statusFilter, toggleStatusMutation]
  );

  const addAction: AddAction = {
    kind: "modal",
    label: "Add Teacher Level",
    onClick: () => {
      setEditId(null);
      setOpen(true);
    },
  };

  return (
    <>
      <PageShell title="Teacher Levels" description="Manage teacher levels.">
        <DataTable<TeacherLevelEntity>
          data={rows}
          columns={columns}
          loading={listQuery.isLoading}
          emptyText={listQuery.isError ? "Failed to load." : "No teacher levels yet."}
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
              placeholder: "Search levels",
            },
            filters: {
              status: {
                value: statusFilter,
                onChange: setStatusFilter,
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
            onClick: () => qc.invalidateQueries({ queryKey: ["teacher-levels", "list"] }),
            disabled: blocked,
            icon: <RefreshCw className="h-4 w-4" />,
            title: "Refresh list",
          }}
        />
      </PageShell>

      <TeacherLevelFormModal
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
        title="Delete this teacher level?"
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
