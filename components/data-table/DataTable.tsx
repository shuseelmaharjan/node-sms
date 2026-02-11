// components/data-table/DataTable.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  OnChangeFn,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";

type DataTablePagination = {
  /** 0-based index */
  pageIndex: number;
  pageSize: number;
  pageCount: number; // total pages computed in parent
  totalCount?: number;

  /** optional 1-based current page from API meta.page */
  currentPage?: number;

  onPageChange: (nextPageIndex: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
};

type ApiMeta = {
  searchable?: string[];
  search_param?: string;
  filterable?: Record<string, string>;
  sortable?: Record<string, string>;
};

type DataTableToolbar = {
  search?: {
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
    enabled?: boolean;
  };
  filters?: Record<string, {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
    label?: string;
    icon?: React.ReactNode;
  }>;
  actions?: React.ReactNode;
};

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, any>[];
  className?: string;

  loading?: boolean;
  emptyText?: string;

  onRowClick?: (row: T) => void;

  getRowId?: (row: T) => string;
  selectedRowId?: string | null;

  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  pagination?: DataTablePagination;
  meta?: ApiMeta;

  toolbar?: DataTableToolbar;

  refresh: {
    onClick: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
    title?: string;
  };
};

export function DataTable<T>({
  data,
  columns,
  className,
  loading = false,
  emptyText = "No results.",
  onRowClick,
  getRowId,
  selectedRowId = null,
  sorting,
  onSortingChange,
  pagination,
  meta,
  toolbar,
  refresh,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sorting ?? [],
      pagination: pagination
        ? { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }
        : undefined,
    },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: Boolean(onSortingChange),
    manualPagination: Boolean(pagination),
    pageCount: pagination?.pageCount,
  });

  const colCount = table.getAllLeafColumns().length;

  const canPrev = pagination ? pagination.pageIndex > 0 : false;
  const canNext = pagination
    ? pagination.pageIndex + 1 < pagination.pageCount
    : false;

  const total = pagination?.totalCount ?? data.length;

  const start = pagination
    ? total === 0
      ? 0
      : pagination.pageIndex * pagination.pageSize + 1
    : data.length
      ? 1
      : 0;

  const end = pagination
    ? total === 0
      ? 0
      : Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)
    : data.length;

  const currentPage =
    pagination?.currentPage ?? (pagination ? pagination.pageIndex + 1 : 1);
  const totalPages = pagination?.pageCount ?? 1;

  const searchable = meta?.searchable ?? [];
  const searchEnabled =
    (toolbar?.search?.enabled ?? true) &&
    Boolean(toolbar?.search) &&
    (searchable.length > 0 || Boolean(toolbar?.search?.placeholder));


  const searchValue = toolbar?.search?.value ?? "";
  const onSearchChange = toolbar?.search?.onChange;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search */}
        <div className="w-full sm:max-w-xs">
          {searchEnabled ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={
                  toolbar?.search?.placeholder ??
                  (searchable.length ? `Search: ${searchable.join(", ")}` : "Search…")
                }

                className={cn(
                  "pl-9 pr-9",
                  "h-10 sm:h-9",
                  "bg-background"
                )}
              />

              {searchValue ? (
                <button
                  type="button"
                  onClick={() => onSearchChange?.("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Right: Filters + Actions + Refresh */}
        <div className="flex items-center justify-end gap-2">
          {/* Filters */}
          {toolbar?.filters && Object.entries(toolbar.filters).map(([key, filter]) => (
            <div key={key} className="flex items-center gap-2">
              {filter.label && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {filter.icon && <span className="inline-flex mr-1">{filter.icon}</span>}
                  {filter.label}:
                </span>
              )}
              <Select
                value={filter.value}
                onValueChange={filter.onChange}
              >
                <SelectTrigger className="w-[180px] h-10 sm:h-9">
                  <SelectValue placeholder={filter.placeholder ?? "Filter"} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {toolbar?.actions ? (
            <div className="flex items-center gap-2">{toolbar.actions}</div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={refresh.onClick}
            disabled={Boolean(refresh.disabled) || loading}
            title={refresh.title ?? "Refresh"}
            aria-label={refresh.title ?? "Refresh"}
          >
            {refresh.icon ? refresh.icon : "↻"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="w-full rounded border">
        <div className="min-w-[720px]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted(); // false | "asc" | "desc"

                    return (
                      <TableHead
                        key={header.id}
                        className="whitespace-nowrap bg-primary text-primary-foreground"
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-2 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                            onClick={() =>
                              header.column.toggleSorting(sorted === "asc")
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {sorted === "asc" ? (
                              <ChevronUp className="ml-2 h-4 w-4" />
                            ) : sorted === "desc" ? (
                              <ChevronDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-90" />
                            )}
                          </Button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={colCount}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Spinner />
                      <span className="text-sm">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => {
                  const rowId = getRowId ? getRowId(row.original) : null;
                  const selected = Boolean(
                    selectedRowId && rowId && rowId === selectedRowId
                  );

                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        onRowClick && "cursor-pointer",
                        onRowClick && "hover:bg-muted/50",
                        selected && "bg-muted"
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="align-middle">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={colCount}
                    className="h-24 text-center text-muted-foreground"
                  >
                    <Image src="/not-found.webp" alt="No data" width={150} height={150} className="mx-auto mb-2" />
                    {emptyText}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Footer: left info + right pager */}
      {pagination ? (
        <div className="bg-card">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: showing/page/rows */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {pagination.totalCount != null ? (
                <>
                  <div>
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {start}-{end}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">{total}</span>
                  </div>

                  <div>
                    Page{" "}
                    <span className="font-medium text-foreground">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                      {totalPages}
                    </span>
                  </div>
                </>
              ) : null}

              {/* Rows per page */}
              <div className="flex items-center gap-2">
                <span>Rows</span>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(v) => pagination.onPageSizeChange(Number(v))}
                >
                  <SelectTrigger className="h-8 w-[92px]">
                    <SelectValue placeholder="Rows" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right: prev/next */}
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={!canPrev || loading}
                onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
              >
                Prev
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={!canNext || loading}
                onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
