"use client";

import * as React from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/DataTable";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

import { billingApi } from "../api/billing.api";
import { billingColumns } from "../columns/billing.columns";
import type { BillingRecord } from "../types/billing.types";
import { StudentSearchModal } from "./student-search-modal";

function toOrdering(sorting: SortingState): string {
  return sorting.map((item) => `${item.desc ? "-" : ""}${item.id}`).join(",");
}

export function BillingPage() {
  const queryClient = useQueryClient();
  const [studentSearchOpen, setStudentSearchOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "paid_at", desc: true },
  ]);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: [
      "billing",
      "list",
      { pageIndex, pageSize, search, statusFilter, sorting },
    ],
    queryFn: () =>
      billingApi.list({
        page: pageIndex + 1,
        page_size: pageSize,
        search: search || undefined,
        ordering: toOrdering(sorting) || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    placeholderData: keepPreviousData,
  });

  React.useEffect(() => {
    setPageIndex(0);
  }, [search, statusFilter, sorting]);

  const receiptMutation = useMutation({
    mutationFn: async (record: BillingRecord) => {
      setDownloadingId(record.id);
      await billingApi.downloadReceipt(record);
    },
    onSuccess: () => toast.success("Receipt downloaded."),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Receipt download failed."),
    onSettled: () => setDownloadingId(null),
  });

  const rows = listQuery.data?.results ?? [];
  const totalCount = listQuery.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const columns = React.useMemo(
    () =>
      billingColumns({
        downloadingId,
        onDownload: (record) => receiptMutation.mutateAsync(record),
      }),
    [downloadingId, receiptMutation]
  );

  const tableMeta = React.useMemo(
    () => ({
      searchable: [
        "receipt_number",
        "external_reference",
        "student__first_name",
        "student__last_name",
        "student__registration_no",
        "student__phone",
      ],
      sortable: {
        paid_at: "Paid at",
        amount: "Amount",
        created_at: "Created at",
      },
      filterable: {},
      ordering_param: "ordering",
      search_param: "search",
    }),
    []
  );

  return (
    <>
      <PageShell
        title="Billing"
        description="Review school-wide payment and receipt history, verify balances, and open student accounts."
        actions={
          <Button type="button" onClick={() => setStudentSearchOpen(true)}>
            <Search className="mr-2 h-4 w-4" />
            Find student
          </Button>
        }
      >
        <DataTable<BillingRecord>
          data={rows}
          columns={columns}
          loading={listQuery.isLoading}
          emptyText={
            listQuery.isError
              ? "Failed to load billing records."
              : "No payment records found."
          }
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={{
            pageIndex,
            pageSize,
            pageCount,
            totalCount,
            currentPage: listQuery.data?.meta?.page ?? pageIndex + 1,
            onPageChange: setPageIndex,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPageIndex(0);
            },
          }}
          meta={tableMeta}
          toolbar={{
            search: {
              value: search,
              onChange: setSearch,
              enabled: true,
              placeholder: "Search receipt",
            },
            filters: {
              status: {
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: "all", label: "All statuses" },
                  { value: "POSTED", label: "Posted" },
                  { value: "REVERSED", label: "Reversed" },
                ],
                label: "Status",
                placeholder: "All statuses",
                icon: <SlidersHorizontal className="h-4 w-4" />,
              },
            },
            actions: null,
          }}
          refresh={{
            onClick: () =>
              queryClient.invalidateQueries({ queryKey: ["billing", "list"] }),
            disabled: listQuery.isFetching,
            icon: (
              <RefreshCw
                className={listQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              />
            ),
            title: "Refresh billing records",
          }}
        />
      </PageShell>

      <StudentSearchModal
        open={studentSearchOpen}
        onOpenChange={setStudentSearchOpen}
      />
    </>
  );
}
