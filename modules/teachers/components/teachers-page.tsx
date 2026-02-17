// modules/teachers/components/teachers-page.tsx
"use client";

import * as React from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { RefreshCw, Filter } from "lucide-react";

import { api } from "@/api";
import { DataTable } from "@/components/data-table/DataTable";
import { PageShell } from "@/components/layout/PageShell";

import type { PaginatedResponse } from "@/types/api";
import { teacherColumns } from "../columns/teacher.columns";
import type { TeacherLevelOption, TeacherListRow } from "../types/teacher.types";
const LIST_URL = "/api/v1/teachers/";
const LEVELS_URL = "/api/v1/teacher-levels/";

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function TeachersPage() {
  const qc = useQueryClient();

  const [q, setQ] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "first_name", desc: false },
  ]);
  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  // filters
  const [teacherLevelId, setTeacherLevelId] = React.useState<string>("all");
  const [hasLevel, setHasLevel] = React.useState<string>("all"); // all | true | false

  // details modal state
  const [openDetails, setOpenDetails] = React.useState(false);
  const [detailsRow, setDetailsRow] = React.useState<TeacherListRow | null>(null);

  const levelsQuery = useQuery<PaginatedResponse<TeacherLevelOption>>({
    queryKey: ["teacher-levels", "list"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<TeacherLevelOption>>(LEVELS_URL, {
        params: { page: 1, page_size: 200 }, // enough for dropdown
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const listQuery = useQuery<PaginatedResponse<TeacherListRow>>({
    queryKey: ["teachers", "list", { pageIndex, pageSize, q, ordering, teacherLevelId, hasLevel }],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<TeacherListRow>>(LIST_URL, {
        params: {
          page: pageIndex + 1,
          page_size: pageSize,
          search: q || undefined,
          ordering: ordering || undefined,

          teacher_level: teacherLevelId === "all" ? undefined : teacherLevelId,
          has_level: hasLevel === "all" ? undefined : hasLevel,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  React.useEffect(() => {
    setPageIndex(0);
  }, [q, sorting, teacherLevelId, hasLevel]);

  const pageData = listQuery.data;
  const rows = pageData?.results ?? [];
  const totalCount = pageData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const meta = (pageData as any)?.meta ?? {
    searchable: ["first_name", "last_name", "phone", "email"],
    search_param: "search",
  };

  const columns = React.useMemo(() => teacherColumns(), []);

  const blocked = listQuery.isFetching;

  const levelOptions =
    levelsQuery.data?.results?.filter((x) => x.status === "active") ?? [];

  return (
    <>
      <PageShell title="Teachers" description="Manage teachers.">
        <DataTable<TeacherListRow>
          data={rows}
          columns={columns}
          loading={listQuery.isLoading}
          emptyText={listQuery.isError ? "Failed to load." : "No teachers yet."}
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
              placeholder: "Search teachers",
            },
            filters: {
              teacher_level: {
                value: teacherLevelId,
                onChange: setTeacherLevelId,
                options: [
                  { value: "all", label: "All levels" },
                  ...levelOptions.map((l) => ({ value: l.id, label: l.level })),
                ],
                placeholder: "Filter teacher level",
                label: "Position",
                icon: <Filter className="h-4 w-4" />,
              },
            },
            actions: null, // add later if needed
          }}
          refresh={{
            onClick: () => qc.invalidateQueries({ queryKey: ["teachers", "list"] }),
            disabled: blocked,
            icon: <RefreshCw className="h-4 w-4" />,
            title: "Refresh list",
          }}
        />
      </PageShell>
    </>
  );
}
