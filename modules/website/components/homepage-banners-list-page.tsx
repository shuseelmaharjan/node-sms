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
import {
  AddActionButton,
  type AddAction,
} from "@/components/data-table/AddActionButton";

import {
  homepageBannerColumns,
  type HomepageBannerEntity,
} from "../columns/homepage-banner.columns";

const HOMEPAGE_BANNERS_URL = "/api/v1/homepage-banners/";
const HOMEPAGE_BANNER_DETAIL_URL = (id: string) =>
  `/api/v1/homepage-banners/${id}/`;
const HOMEPAGE_BANNERS_REORDER_URL = "/api/v1/homepage-banners/reorder/";

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

function getHomepageBannerErrorMessage(error: any, fallback: string): string {
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

export function HomepageBannersListPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [deleteTarget, setDeleteTarget] =
    React.useState<HomepageBannerEntity | null>(null);

  const [q, setQ] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const pageSizeInitialized = React.useRef(false);

  // keep default empty so normal refresh stays plain
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  const listQuery = useQuery<PaginatedResponse<HomepageBannerEntity>>({
    queryKey: ["homepage-banners", "list", { pageIndex, pageSize, q, ordering }],
    queryFn: async () => {
      const params: Record<string, any> = {
        page: pageIndex + 1,
        page_size: pageSize,
      };

      if (q.trim()) params.search = q.trim();
      if (ordering) params.ordering = ordering;

      const res = await api.get<PaginatedResponse<HomepageBannerEntity>>(
        HOMEPAGE_BANNERS_URL,
        { params }
      );

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
      await api.delete(HOMEPAGE_BANNER_DETAIL_URL(id));
    },
    onSuccess: async () => {
      toast.success("Homepage banner deleted");
      await qc.invalidateQueries({ queryKey: ["homepage-banners", "list"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error(
        getHomepageBannerErrorMessage(error, "Failed to delete banner")
      );
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (payload: { ordered_ids: string[] }) => {
      const res = await api.post(HOMEPAGE_BANNERS_REORDER_URL, payload);
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Banner order updated");
      await qc.invalidateQueries({ queryKey: ["homepage-banners", "list"] });
    },
    onError: async (error: any) => {
      toast.error(
        getHomepageBannerErrorMessage(error, "Failed to reorder banners")
      );
      await qc.invalidateQueries({ queryKey: ["homepage-banners", "list"] });
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
    (item: HomepageBannerEntity) => (orderMap.get(item.id) ?? 0) > 0,
    [orderMap]
  );

  const canMoveDown = React.useCallback(
    (item: HomepageBannerEntity) =>
      (orderMap.get(item.id) ?? -1) < rows.length - 1,
    [orderMap, rows.length]
  );

  const reorderBySwap = React.useCallback(
    async (item: HomepageBannerEntity, direction: "up" | "down") => {
      if (ordering) {
        toast.error("Reordering is only available in default list order.");
        return;
      }

      const currentIndex = orderMap.get(item.id);
      if (currentIndex == null) return;

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= rows.length) return;

      const next = [...rows];
      [next[currentIndex], next[targetIndex]] = [
        next[targetIndex],
        next[currentIndex],
      ];

      qc.setQueryData(
        ["homepage-banners", "list", { pageIndex, pageSize, q, ordering }],
        (old: PaginatedResponse<HomepageBannerEntity> | undefined) => {
          if (!old?.results) return old;

          return {
            ...old,
            results: next.map((x, index) => ({
              ...x,
              sort_order: index + 1,
            })),
          };
        }
      );

      try {
        await reorderMutation.mutateAsync({
          ordered_ids: next.map((x) => x.id),
        });
      } catch {
        // invalidate handles rollback
      }
    },
    [orderMap, ordering, pageIndex, pageSize, q, qc, reorderMutation, rows]
  );

  const columns = React.useMemo(
    () =>
      homepageBannerColumns({
        canMoveUp,
        canMoveDown,
        onEdit: (row) =>
          router.push(
            `/website/manage-homepage/update?id=${encodeURIComponent(row.id)}`
          ),
        onDelete: (row) => setDeleteTarget(row),
        onMoveUp: (row) => reorderBySwap(row, "up"),
        onMoveDown: (row) => reorderBySwap(row, "down"),
      }),
    [canMoveDown, canMoveUp, reorderBySwap, router]
  );

  const searchable = pageData?.meta?.searchable ?? ["title", "subtitle"];
  const searchEnabled = true;

  const addAction: AddAction = {
    kind: "link",
    href: "/website/manage-homepage/add",
    label: "Add Banner",
  };

  const handleRefresh = () => {
    setQ("");
    setSorting([]);
    setPageIndex(0);
  };

  return (
    <>
      <PageShell title="Homepage Banners" description="Manage homepage banners.">
        <DataTable<HomepageBannerEntity>
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
              enabled: searchEnabled,
              placeholder: "Search banners",
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
        title="Delete this banner?"
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}