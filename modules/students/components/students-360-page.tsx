"use client";

import * as React from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { RefreshCw, Filter } from "lucide-react";

import { api } from "@/api";
import { DataTable } from "@/components/data-table/DataTable";
import { PageShell } from "@/components/layout/PageShell";
import type { PaginatedResponse } from "@/types/api";

import { student360Columns } from "../columns/student360.columns";
import type { Student360ListRow } from "../types/student360.types";

const LIST_URL = "/api/v1/students-360/";

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function Students360Page() {
  const qc = useQueryClient();

  const [q, setQ] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  // Useful filters for the list:
  const [enrollmentStatus, setEnrollmentStatus] = React.useState<string>("all"); // all|enrolled|dropped|...
  const [batchId, setBatchId] = React.useState<string>("all"); // keep as string for UI

  const listQuery = useQuery<PaginatedResponse<Student360ListRow>>({
    queryKey: ["students-360", "list", { pageIndex, pageSize, q, ordering, enrollmentStatus, batchId }],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Student360ListRow>>(LIST_URL, {
        params: {
          page: pageIndex + 1,
          page_size: pageSize,
          search: q || undefined,
          ordering: ordering || undefined,
          enrollment_status: enrollmentStatus === "all" ? undefined : enrollmentStatus,
          batch: batchId === "all" ? undefined : batchId,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  React.useEffect(() => {
    setPageIndex(0);
  }, [q, sorting, enrollmentStatus, batchId]);

  const pageData = listQuery.data;
  const rows = pageData?.results ?? [];
  const totalCount = pageData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const meta = (pageData as any)?.meta ?? {
    searchable: [],
    search_param: "search",
    ordering_param: "ordering",
  };

  const columns = React.useMemo(() => student360Columns(), []);
  const blocked = listQuery.isFetching;

  return (
    <PageShell
      title="Students Details"
      description="Search students (enrollment history + fees + billing + wallets)."
    >
      <DataTable<Student360ListRow>
        data={rows}
        columns={columns}
        loading={listQuery.isLoading}
        emptyText={listQuery.isError ? "Failed to load." : "No students found."}
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
            placeholder: "Search students (name, username, phone, email)",
          },
          filters: {
            enrollment_status: {
              value: enrollmentStatus,
              onChange: setEnrollmentStatus,
              options: [
                { value: "all", label: "All enrollments" },
                { value: "enrolled", label: "Enrolled" },
                { value: "dropped", label: "Dropped" },
                { value: "graduated", label: "Graduated" },
                { value: "suspended", label: "Suspended" },
                { value: "alumni", label: "Alumni" },
              ],
              placeholder: "Filter enrollment status",
              label: "Enrollment",
              icon: <Filter className="h-4 w-4" />,
            },
            batch: {
              value: batchId,
              onChange: setBatchId,
              // If you want a real batch dropdown, wire a batches query like Teachers levelQuery.
              options: [
                { value: "all", label: "All batches" },
              ],
              placeholder: "Filter batch",
              label: "Batch",
              icon: <Filter className="h-4 w-4" />,
            },
          },
          actions: null,
        }}
        refresh={{
          onClick: () => qc.invalidateQueries({ queryKey: ["students-360", "list"] }),
          disabled: blocked,
          icon: <RefreshCw className="h-4 w-4" />,
          title: "Refresh list",
        }}
      />
    </PageShell>
  );
}
