"use client";

import * as React from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { Search, RefreshCw } from "lucide-react";

import { DataTable } from "@/components/data-table/DataTable";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { deleteAdmin, fetchAdmins, type AdminListItem } from "../api/admins.api";
import { adminsColumns } from "../columns/admins.columns";
import { adminsKeys } from "../admins.keys";
import { toOrdering } from "../admins.utils";

export function AdminsListPage() {
  const qc = useQueryClient();

  const [q, setQ] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "role", desc: false }]);

  const [deleteTarget, setDeleteTarget] = React.useState<AdminListItem | null>(null);

  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [q, pageSize, ordering]);

  const listQuery = useQuery({
    queryKey: adminsKeys.list({ q, pageIndex, pageSize, ordering }),
    queryFn: () =>
      fetchAdmins({
        page: pageIndex + 1,
        page_size: pageSize,
        search: q || undefined,
        ordering: ordering || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteAdmin(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminsKeys.all });
      setDeleteTarget(null);
    },
  });

  const pageData = listQuery.data;
  const rows = pageData?.results ?? [];
  const totalCount = pageData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const blocked = listQuery.isFetching || del.isPending;

  const columns = React.useMemo(
    () => adminsColumns({ onDelete: (row) => setDeleteTarget(row) }),
    []
  );

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admins</h1>
            <p className="text-muted-foreground">Manage administrator accounts and permissions</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => qc.invalidateQueries({ queryKey: adminsKeys.all })}
              disabled={blocked}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button asChild>
              <Link href="/admins/new/personal">Add Admin</Link>
            </Button>
          </div>
        </div>

        <DataTable
          data={rows}
          columns={columns}
          loading={listQuery.isLoading}
          emptyText={listQuery.isError ? "Failed to load." : "No admins found."}
          sorting={sorting}
          onSortingChange={setSorting}
          toolbar={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search admins…"
                  className="pl-8"
                />
              </div>
            </div>
          }
          pagination={{
            pageIndex,
            pageSize,
            pageCount,
            totalCount,
            currentPage: pageData?.meta?.page,
            onPageChange: setPageIndex,
            onPageSizeChange: (n) => {
              setPageSize(n);
              setPageIndex(0);
            },
          }}
          meta={{
            searchable: pageData?.meta?.searchable ?? [],
          }}
        />
      </div>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        loading={del.isPending}
        title="Delete admin?"
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await del.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
