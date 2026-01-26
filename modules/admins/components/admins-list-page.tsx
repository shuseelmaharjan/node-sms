"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { RefreshCw, Plus, Search } from "lucide-react";

import { api } from "@/api";
import { DataTable } from "@/components/data-table/DataTable";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaginatedResponse } from "@/types/api";
import { PageShell } from "@/components/layout/PageShell";

import {
  onboardingAdminColumns,
  type OnboardingAdminEntity,
} from "../columns/onboarding-admin.columns";

const LIST_URL = "/api/onboarding/admin/";
const DETAIL_URL = (id: string) => `/api/onboarding/admin/${id}/`;

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function AdminsListPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [deleteTarget, setDeleteTarget] =
    React.useState<OnboardingAdminEntity | null>(null);

  const [q, setQ] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const pageSizeInitialized = React.useRef(false);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "first_name", desc: false },
  ]);

  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  const listQuery = useQuery<PaginatedResponse<OnboardingAdminEntity>>({
    queryKey: ["onboarding-admin", "list", { pageIndex, pageSize, q, ordering }],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<OnboardingAdminEntity>>(LIST_URL, {
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
      await qc.invalidateQueries({ queryKey: ["onboarding-admin", "list"] });
      setDeleteTarget(null);
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail ?? "Failed to delete onboarding"),
  });

  const blocked = listQuery.isFetching || deleteMutation.isPending;

  const pageData = listQuery.data;
  const rows = pageData?.results ?? [];
  const totalCount = pageData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const columns = React.useMemo(
    () =>
      onboardingAdminColumns({
        onEdit: (row) => router.push(`/admins/update/${row.user.id}`),
        onDelete: (row) => setDeleteTarget(row),
      }),
    [router]
  );

  return (
    <>
      <PageShell
        title="Admins"
        description="Manage admin onboardings."
        actions={
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/admins/add">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => qc.invalidateQueries({ queryKey: ["onboarding-admin", "list"] })}
              disabled={blocked}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div className="mb-3 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search (name/email/phone/username)…"
              className="pl-8"
            />
          </div>
        </div>

        <DataTable<OnboardingAdminEntity>
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
            searchable: pageData?.meta?.searchable ?? [],
          }}
        />
      </PageShell>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        title="Delete this onboarding?"
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.user.id);
        }}
      />
    </>
  );
}
