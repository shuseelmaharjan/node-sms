// modules/students/components/students-list-page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { RefreshCw, Filter } from "lucide-react";

import { api } from "@/api";
import { DataTable } from "@/components/data-table/DataTable";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import type { PaginatedResponse } from "@/types/api";
import { PageShell } from "@/components/layout/PageShell";
import { AddActionButton, type AddAction } from "@/components/data-table/AddActionButton";

import { studentColumns, type StudentEntity } from "../columns/student.columns";
const LIST_URL = "/api/onboarding/students/?status=draft";
const DETAIL_URL = (id: string) => `/api/onboarding/students/${id}/`;

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function StudentsListPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [deleteTarget, setDeleteTarget] = React.useState<StudentEntity | null>(null);

  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("draft");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const pageSizeInitialized = React.useRef(false);

  const [sorting, setSorting] = React.useState<SortingState>([{ id: "first_name", desc: false }]);
  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  const listQuery = useQuery<PaginatedResponse<StudentEntity>>({
    queryKey: ["students", "list", { pageIndex, pageSize, q, ordering, statusFilter }],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<StudentEntity>>(LIST_URL, {
        params: {
          page: pageIndex + 1,
          page_size: pageSize,
          search: q || undefined,
          ordering: ordering || undefined,
          status_filter: statusFilter || undefined, // matches backend viewset
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(DETAIL_URL(id));
    },
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["students", "list"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to delete student"),
  });

  const blocked = listQuery.isFetching || deleteMutation.isPending;

  const pageData = listQuery.data;
  const rows = pageData?.results ?? [];
  const totalCount = pageData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const columns = React.useMemo(
    () =>
      studentColumns({
        onEdit: (row) => router.push(`/student-enrollment/update-record?user_id=${row.id}`),
        onDelete: (row) => setDeleteTarget(row),
        onView: (row) => router.push(`/student-enrollment/confirm-enrollment?user_id=${row.id}`),
      }),
    [router]
  );

  const searchable = pageData?.meta?.searchable ?? [];
  const searchEnabled = searchable.length > 0;

  const addAction: AddAction = {
    kind: "link",
    href: "/student-enrollment/add-record",
    label: "Add Student",
  };

  return (
    <>
      <PageShell title="Students" description="Manage students.">
        <DataTable<StudentEntity>
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
            search_param: pageData?.meta?.search_param,
          }}
          toolbar={{
            search: {
              value: q,
              onChange: setQ,
              enabled: searchEnabled,
              placeholder: "Search",
            },
            // filters: {
            //   status_filter: {
            //     value: statusFilter,
            //     onChange: setStatusFilter,
            //     options: [
            //       { value: "active", label: "Active" },
            //       { value: "deactive", label: "Deactive" },
            //       { value: "all", label: "All" },
            //     ],
            //     placeholder: "Filter by status",
            //     label: "Status",
            //     icon: <Filter className="h-4 w-4" />,
            //   },
            // },
            actions: <AddActionButton add={addAction} />,
          }}
          refresh={{
            onClick: () => qc.invalidateQueries({ queryKey: ["students", "list"] }),
            disabled: blocked,
            icon: <RefreshCw className="h-4 w-4" />,
            title: "Refresh list",
          }}
        />
      </PageShell>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        title="Delete this student?"
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
