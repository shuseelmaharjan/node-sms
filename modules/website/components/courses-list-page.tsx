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

import { PageShell } from "@/components/layout/PageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { AddActionButton, type AddAction } from "@/components/data-table/AddActionButton";

import type { CourseEntity } from "../types/course.types";
import {
  deleteCourse,
  fetchCourses,
  reorderCourses,
} from "../api/course.api";
import { courseColumns } from "../columns/course.columns";
import { getCourseErrorMessage } from "../lib/course-error";

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function CoursesListPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [deleteTarget, setDeleteTarget] = React.useState<CourseEntity | null>(null);

  const [q, setQ] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const pageSizeInitialized = React.useRef(false);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "name", desc: false },
  ]);

  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  const listQuery = useQuery({
    queryKey: ["courses", "list", { pageIndex, pageSize, q, ordering }],
    queryFn: async () =>
      fetchCourses({
        page: pageIndex + 1,
        page_size: pageSize,
        search: q || undefined,
        ordering: ordering || undefined,
      }),
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
    mutationFn: deleteCourse,
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
    mutationFn: reorderCourses,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["courses", "list"] });
    },
    onError: async (error: any) => {
      toast.error(getCourseErrorMessage(error, "Failed to reorder courses"));
      await qc.invalidateQueries({ queryKey: ["courses", "list"] });
    },
  });

  const blocked = listQuery.isFetching || deleteMutation.isPending || reorderMutation.isPending;

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
    (course: CourseEntity) =>
      (orderMap.get(course.id) ?? -1) < rows.length - 1,
    [orderMap, rows.length]
  );

  const reorderBySwap = React.useCallback(
    async (course: CourseEntity, direction: "up" | "down") => {
      if (ordering && ordering !== "sort_order") {
        toast.error("Reordering is only available when sorted by default order.");
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
        (old: any) => {
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
        // rollback handled via invalidate
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

  const searchable = pageData?.meta?.searchable ?? [];
  const searchEnabled = searchable.length > 0;

  const addAction: AddAction = {
    kind: "link",
    href: "/website/manage-courses/add",
    label: "Add Course",
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
            search_param: pageData?.meta?.search_param,
          }}
          toolbar={{
            search: {
              value: q,
              onChange: setQ,
              enabled: searchEnabled,
              placeholder: "Search",
            },
            actions: <AddActionButton add={addAction} />,
          }}
          refresh={{
            onClick: () => qc.invalidateQueries({ queryKey: ["courses", "list"] }),
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