"use client";

import * as React from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import {
  Download,
  FilePlus2,
  Filter,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api";
import { DataTable } from "@/components/data-table/DataTable";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

import { invoiceApi } from "../api/invoice.api";
import { invoiceColumns } from "../columns/invoice.columns";
import type {
  BulkGenerateInvoiceResponse,
  InvoiceRecord,
} from "../types/invoice.types";
import { GenerateInvoiceModal } from "./generate-invoice-modal";

function toOrdering(sorting: SortingState) {
  return sorting
    .map((item) => `${item.desc ? "-" : ""}${item.id}`)
    .join(",");
}

export function InvoicesPage() {
  const queryClient = useQueryClient();

  const [generateOpen, setGenerateOpen] = React.useState(false);

  const [latestResult, setLatestResult] =
    React.useState<BulkGenerateInvoiceResponse | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [batchFilter, setBatchFilter] = React.useState("all");
  const [classFilter, setClassFilter] = React.useState("all");
  const [sectionFilter, setSectionFilter] = React.useState("all");

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "created_at",
      desc: true,
    },
  ]);

  const [downloadingId, setDownloadingId] =
    React.useState<string | null>(null);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    new Set()
  );

  const batchesQuery = useQuery({
    queryKey: ["invoice", "filters", "batches"],
    queryFn: invoiceApi.listBatches,
  });

  const classesQuery = useQuery({
    queryKey: [
      "invoice",
      "filters",
      "classes",
      batchFilter,
    ],
    queryFn: () =>
      invoiceApi.listClasses(Number(batchFilter)),
    enabled: batchFilter !== "all",
  });

  const sectionsQuery = useQuery({
    queryKey: [
      "invoice",
      "filters",
      "sections",
      classFilter,
    ],
    queryFn: () =>
      invoiceApi.listSections(classFilter),
    enabled: classFilter !== "all",
  });

  const listQuery = useQuery({
    queryKey: [
      "invoice",
      "list",
      {
        pageIndex,
        pageSize,
        search,
        statusFilter,
        batchFilter,
        classFilter,
        sectionFilter,
        sorting,
      },
    ],
    queryFn: () =>
      invoiceApi.list({
        page: pageIndex + 1,
        page_size: pageSize,
        search: search || undefined,
        ordering: toOrdering(sorting) || undefined,
        status:
          statusFilter === "all"
            ? undefined
            : statusFilter,
        batch_id:
          batchFilter === "all"
            ? undefined
            : Number(batchFilter),
        academic_class_id:
          classFilter === "all"
            ? undefined
            : classFilter,
        section_id:
          sectionFilter === "all"
            ? undefined
            : sectionFilter,
      }),
    placeholderData: keepPreviousData,
  });

  React.useEffect(() => {
    setPageIndex(0);
  }, [
    search,
    statusFilter,
    batchFilter,
    classFilter,
    sectionFilter,
    sorting,
  ]);

  React.useEffect(() => {
    setClassFilter("all");
    setSectionFilter("all");
  }, [batchFilter]);

  React.useEffect(() => {
    setSectionFilter("all");
  }, [classFilter]);

  /*
   * Keep selected IDs valid after records are refreshed.
   *
   * This intentionally preserves selections from other pages because
   * the merged-PDF endpoint accepts invoice IDs from multiple pages.
   */
  React.useEffect(() => {
    if (!listQuery.data) {
      return;
    }

    const currentResponseIds = new Set(
      listQuery.data.results.map((invoice) => invoice.id)
    );

    setSelectedIds((current) => {
      if (current.size === 0) {
        return current;
      }

      /*
       * We do not remove IDs merely because they are not on the current
       * page. This permits cross-page invoice selection.
       */
      const next = new Set(current);

      for (const invoiceId of currentResponseIds) {
        if (!invoiceId) {
          next.delete(invoiceId);
        }
      }

      return next;
    });
  }, [listQuery.data]);

  const downloadOneMutation = useMutation({
    mutationFn: async (invoice: InvoiceRecord) => {
      setDownloadingId(invoice.id);

      await invoiceApi.downloadOne(invoice);
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },

    onSettled: () => {
      setDownloadingId(null);
    },
  });

  const rows = listQuery.data?.results ?? [];

  const selectedDownloadMutation = useMutation({
    mutationFn: async () => {
      const invoiceIds = Array.from(selectedIds);

      if (invoiceIds.length === 0) {
        throw new Error(
          "Select at least one invoice to download."
        );
      }

      await invoiceApi.downloadBulk(
        invoiceIds,
        `selected-fee-invoices-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );
    },

    onSuccess: () => {
      toast.success(
        "Selected invoice PDF downloaded successfully."
      );
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const toggleRow = React.useCallback(
    (
      invoiceId: string,
      checked: boolean
    ) => {
      setSelectedIds((current) => {
        const next = new Set(current);

        if (checked) {
          next.add(invoiceId);
        } else {
          next.delete(invoiceId);
        }

        return next;
      });
    },
    []
  );

  const toggleCurrentPage = React.useCallback(
    (checked: boolean) => {
      setSelectedIds((current) => {
        const next = new Set(current);

        for (const invoice of rows) {
          if (checked) {
            next.add(invoice.id);
          } else {
            next.delete(invoice.id);
          }
        }

        return next;
      });
    },
    [rows]
  );

  const columns = React.useMemo(
    () =>
      invoiceColumns({
        rows,
        selectedIds,
        onToggleRow: toggleRow,
        onTogglePage: toggleCurrentPage,
        downloadingId,
        onDownload: async (invoice) => {
          await downloadOneMutation.mutateAsync(invoice);
        },
      }),
    [
      rows,
      selectedIds,
      toggleRow,
      toggleCurrentPage,
      downloadingId,
      downloadOneMutation,
    ]
  );

  const totalCount = listQuery.data?.count ?? 0;

  const pageCount = Math.max(
    1,
    Math.ceil(totalCount / pageSize)
  );

  const batchOptions = React.useMemo(
    () => [
      {
        value: "all",
        label: "All batches",
      },
      ...(batchesQuery.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    ],
    [batchesQuery.data]
  );

  const classOptions = React.useMemo(
    () => [
      {
        value: "all",
        label: "All classes",
      },
      ...(classesQuery.data ?? []).map((item) => ({
        value: item.id,
        label: item.name,
      })),
    ],
    [classesQuery.data]
  );

  const sectionOptions = React.useMemo(
    () => [
      {
        value: "all",
        label: "All sections",
      },
      ...(sectionsQuery.data ?? []).map((item) => ({
        value: item.id,
        label: item.name,
      })),
    ],
    [sectionsQuery.data]
  );

  /*
   * Normalize backend pagination metadata into the exact shape expected
   * by the global DataTable component.
   *
   * Do not pass the backend's filterable object because its values are
   * objects, while DataTable expects Record<string, string>.
   */
  const tableMeta = React.useMemo(
    () => ({
      searchable: [
        "invoice_number",
        "student__first_name",
        "student__middle_name",
        "student__last_name",
        "student__registration_no",
        "student__phone",
      ],

      sortable: {
        invoice_date: "Invoice date",
        due_date: "Due date",
        period_start: "Period start",
        created_at: "Created at",
        due_amount: "Due amount",
        total_amount: "Total amount",
      },

      filterable: {},

      ordering_param: "ordering",
      search_param: "search",
    }),
    []
  );

  const handleRefresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["invoice", "list"],
    });
  }, [queryClient]);

  const handleGenerated = React.useCallback(
    async (
      result: BulkGenerateInvoiceResponse
    ) => {
      setLatestResult(result);
      setGenerateOpen(false);
      setSelectedIds(new Set());

      await queryClient.invalidateQueries({
        queryKey: ["invoice", "list"],
      });
    },
    [queryClient]
  );

  return (
    <>
      <PageShell
        title="Invoices"
        description="Generate batch, class or section invoices and manage generated invoice records."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.size > 0 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    selectedDownloadMutation.isPending
                  }
                  onClick={() =>
                    selectedDownloadMutation.mutate()
                  }
                >
                  <Download className="mr-2 h-4 w-4" />

                  {selectedDownloadMutation.isPending
                    ? "Preparing PDF…"
                    : `Download selected PDF (${selectedIds.size})`}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Clear selected invoices"
                  aria-label="Clear selected invoices"
                  disabled={
                    selectedDownloadMutation.isPending
                  }
                  onClick={() =>
                    setSelectedIds(new Set())
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : null}

            <Button
              type="button"
              onClick={() =>
                setGenerateOpen(true)
              }
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>
        }
      >
        {latestResult ? (
          <div className="mb-4 grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Summary
              label="Processed"
              value={
                latestResult.summary
                  .processed_count
              }
            />

            <Summary
              label="Created"
              value={
                latestResult.summary
                  .created_count
              }
            />

            <Summary
              label="Existing"
              value={
                latestResult.summary
                  .existing_count
              }
            />

            <Summary
              label="Failed"
              value={
                latestResult.summary
                  .failed_count
              }
            />
          </div>
        ) : null}

        <DataTable<InvoiceRecord>
          data={rows}
          columns={columns}
          loading={listQuery.isLoading}
          emptyText={
            listQuery.isError
              ? "Failed to load invoices."
              : "No invoices generated yet."
          }
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={{
            pageIndex,
            pageSize,
            pageCount,
            totalCount,
            currentPage:
              listQuery.data?.meta?.page ??
              pageIndex + 1,

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
              placeholder:
                "Search invoice or student",
            },

            filters: {
              batch: {
                value: batchFilter,
                onChange: setBatchFilter,
                options: batchOptions,
                label: "Batch",
                placeholder: "All batches",
                icon: (
                  <Filter className="h-4 w-4" />
                ),
              },

              class: {
                value: classFilter,
                onChange: setClassFilter,
                options: classOptions,
                label: "Class",
                placeholder: "All classes",
                icon: (
                  <Filter className="h-4 w-4" />
                ),
              },

              section: {
                value: sectionFilter,
                onChange: setSectionFilter,
                options: sectionOptions,
                label: "Section",
                placeholder: "All sections",
                icon: (
                  <Filter className="h-4 w-4" />
                ),
              },

              status: {
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  {
                    value: "all",
                    label: "All statuses",
                  },
                  {
                    value: "ISSUED",
                    label: "Issued",
                  },
                  {
                    value: "PARTIALLY_PAID",
                    label: "Partially paid",
                  },
                  {
                    value: "PAID",
                    label: "Paid",
                  },
                  {
                    value: "VOID",
                    label: "Void",
                  },
                ],
                label: "Status",
                placeholder: "All statuses",
                icon: (
                  <Filter className="h-4 w-4" />
                ),
              },
            },

            /*
             * Selected-PDF actions were moved to PageShell.actions.
             */
            actions: null,
          }}
          refresh={{
            onClick: handleRefresh,
            disabled: listQuery.isFetching,
            icon: (
              <RefreshCw
                className={
                  listQuery.isFetching
                    ? "h-4 w-4 animate-spin"
                    : "h-4 w-4"
                }
              />
            ),
            title: "Refresh invoices",
          }}
        />
      </PageShell>

      <GenerateInvoiceModal
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerated={handleGenerated}
      />
    </>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-background p-3 ring-1 ring-border/60">
      <div className="text-xs text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 text-xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}