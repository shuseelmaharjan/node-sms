"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import { PageShell } from "@/components/layout/PageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { AddActionButton, type AddAction } from "@/components/data-table/AddActionButton";

import { courseColumns, type CourseEntity } from "../columns/course.columns";

const COURSES_URL = "/api/v1/courses/";
const COURSE_DETAIL_URL = (id: string) => `/api/v1/courses/${id}/`;
const COURSE_REORDER_URL = "/api/v1/courses/reorder/";

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

function getCourseErrorMessage(error: any, fallback: string): string {
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

export function CoursesListPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [deleteTarget, setDeleteTarget] = React.useState<CourseEntity | null>(null);

  const [q, setQ] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const pageSizeInitialized = React.useRef(false);

  // keep empty by default so initial fetch is:
  // /api/v1/courses/?page=1&page_size=10
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  const listQuery = useQuery<PaginatedResponse<CourseEntity>>({
    queryKey: ["courses", "list", { pageIndex, pageSize, q, ordering }],
    queryFn: async () => {
      const params: Record<string, any> = {
        page: pageIndex + 1,
        page_size: pageSize,
      };

      if (q.trim()) {
        params.search = q.trim();
      }

      if (ordering) {
        params.ordering = ordering;
      }

      const res = await api.get<PaginatedResponse<CourseEntity>>(COURSES_URL, {
        params,
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
      await api.delete(COURSE_DETAIL_URL(id));
    },
    onSuccess: async () => {
      toast.success("Course deleted");
      await qc.invalidateQueries({ queryKey: ["courses", "list"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error(getCourseErrorMessage(error, "Failed to delete course"));
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (payload: { ordered_ids: string[] }) => {
      const res = await api.post(COURSE_REORDER_URL, payload);
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Course order updated");
      await qc.invalidateQueries({ queryKey: ["courses", "list"] });
    },
    onError: async (error: any) => {
      toast.error(getCourseErrorMessage(error, "Failed to reorder courses"));
      await qc.invalidateQueries({ queryKey: ["courses", "list"] });
    },
  });

  const blocked =
    listQuery.isFetching || deleteMutation.isPending || reorderMutation.isPending;

  const pageData = listQuery.data;
  const rows = pageData?.results ?? [];
  const totalCount = pageData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const orderMap = React.useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((item, index) => map.set(item.id, index));
    return map;
  }, [rows]);

  const canMoveUp = React.useCallback(
    (course: CourseEntity) => (orderMap.get(course.id) ?? 0) > 0,
    [orderMap]
  );

  const canMoveDown = React.useCallback(
    (course: CourseEntity) => (orderMap.get(course.id) ?? -1) < rows.length - 1,
    [orderMap, rows.length]
  );

  const reorderBySwap = React.useCallback(
    async (course: CourseEntity, direction: "up" | "down") => {
      // allow reorder only when there is no active sorting
      if (ordering) {
        toast.error("Reordering is only available in default list order.");
        return;
      }

      const currentIndex = orderMap.get(course.id);
      if (currentIndex == null) return;

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= rows.length) return;

      const next = [...rows];
      [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];

      qc.setQueryData(
        ["courses", "list", { pageIndex, pageSize, q, ordering }],
        (old: PaginatedResponse<CourseEntity> | undefined) => {
          if (!old?.results) return old;

          return {
            ...old,
            results: next.map((item, index) => ({
              ...item,
              sort_order: index + 1,
            })),
          };
        }
      );

      try {
        await reorderMutation.mutateAsync({
          ordered_ids: next.map((item) => item.id),
        });
      } catch {
        // handled by invalidate
      }
    },
    [orderMap, ordering, pageIndex, pageSize, q, qc, reorderMutation, rows]
  );

  const columns = React.useMemo(
    () =>
      courseColumns({
        canMoveUp,
        canMoveDown,
        onEdit: (row) =>
          router.push(`/website/manage-courses/update?id=${encodeURIComponent(row.id)}`),
        onDelete: (row) => setDeleteTarget(row),
        onMoveUp: (row) => reorderBySwap(row, "up"),
        onMoveDown: (row) => reorderBySwap(row, "down"),
      }),
    [canMoveDown, canMoveUp, reorderBySwap, router]
  );

  const searchable = pageData?.meta?.searchable ?? ["name", "slug", "tags"];

  const addAction: AddAction = {
    kind: "link",
    href: "/website/manage-courses/add",
    label: "Add Course",
  };

  const handleRefresh = async () => {
    // reset to plain list request
    setQ("");
    setSorting([]);
    setPageIndex(0);

    await qc.invalidateQueries({ queryKey: ["courses", "list"] });
  };

  return (
    <>
      <PageShell title="Courses" description="Manage courses.">
        <DataTable<CourseEntity>
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
              enabled: true,
              placeholder: "Search courses",
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

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        title="Delete this course?"
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}