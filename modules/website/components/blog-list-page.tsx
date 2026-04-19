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
import { PageShell } from "@/components/layout/PageShell";
import { DataTable } from "@/components/data-table/DataTable";
import {
  AddActionButton,
  type AddAction,
} from "@/components/data-table/AddActionButton";

import { blogColumns } from "../columns/blog.columns";
import type { BlogEntity } from "../types/blog.types";

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function BlogListPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [q, setQ] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["blogs", { pageIndex, pageSize, q, ordering }],
    queryFn: async () => {
      const res = await api.get("/api/v1/blogs/", {
        params: {
          page: pageIndex + 1,
          page_size: pageSize,
          search: q || undefined,
          ordering: ordering || undefined,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/blogs/${id}/`);
    },
    onSuccess: async () => {
      toast.success("Blog deleted");
      await qc.invalidateQueries({ queryKey: ["blogs"] });
    },
    onError: () => {
      toast.error("Failed to delete blog");
    },
  });

  const blocked = isFetching || deleteMutation.isPending;

  const handleRefresh = async () => {
    setQ("");
    setSorting([]);
    setPageIndex(0);
    await qc.invalidateQueries({ queryKey: ["blogs"] });
  };

  const addAction: AddAction = {
    label: "Add Blog",
    href: "/website/manage-blogs/create",
    kind: "link",
  };

  const rows = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <PageShell title="Blogs" description="Manage blogs.">
      <DataTable<BlogEntity>
        data={rows}
        columns={blogColumns({
          onEdit: (row: BlogEntity) =>
            router.push(`/website/manage-blogs/update?id=${row.id}`),
          onDelete: (row: BlogEntity) => deleteMutation.mutate(row.id),
        })}
        loading={isLoading}
        emptyText={isError ? "Failed to load blogs." : "No blogs found."}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={{
          pageIndex,
          pageSize,
          pageCount,
          totalCount,
          currentPage: data?.meta?.page,
          onPageChange: setPageIndex,
          onPageSizeChange: (n) => {
            setPageSize(n);
            setPageIndex(0);
          },
        }}
        meta={{
          searchable: data?.meta?.searchable ?? ["title", "author"],
          search_param: data?.meta?.search_param ?? "search",
        }}
        toolbar={{
          search: {
            value: q,
            onChange: setQ,
            enabled: true,
            placeholder: "Search blogs...",
          },
          actions: <AddActionButton add={addAction} />,
        }}
        refresh={{
          onClick: handleRefresh,
          disabled: blocked,
          icon: <RefreshCw className="h-4 w-4" />,
          title: "Refresh",
        }}
      />
    </PageShell>
  );
}