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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

type DataTablePagination = {
  /** 0-based index */
  pageIndex: number;
  pageSize: number;
  pageCount: number; // total pages (computed in parent)
  totalCount?: number;

  /** optional 1-based current page from API meta.page */
  currentPage?: number;

  onPageChange: (nextPageIndex: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
};

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, any>[];
  className?: string;

  loading?: boolean;
  emptyText?: string;

  onRowClick?: (row: T) => void;

  toolbar?: React.ReactNode;

  getRowId?: (row: T) => string;
  selectedRowId?: string | null;

  /** server-side sorting */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  /** server-side pagination */
  pagination?: DataTablePagination;

  /** optional meta display */
  meta?: {
    searchable?: string[];
  };
};

export function DataTable<T>({
  data,
  columns,
  className,
  loading = false,
  emptyText = "No results.",
  onRowClick,
  toolbar,
  getRowId,
  selectedRowId = null,

  sorting,
  onSortingChange,

  pagination,
  meta,
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
  const canNext = pagination ? pagination.pageIndex + 1 < pagination.pageCount : false;

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

  const currentPage = pagination?.currentPage ?? (pagination ? pagination.pageIndex + 1 : 1);
  const totalPages = pagination?.pageCount ?? 1;

  return (
    <div className={cn("space-y-3", className)}>
      {toolbar ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {toolbar}
        </div>
      ) : null}

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
                            onClick={() => header.column.toggleSorting(sorted === "asc")}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === "asc" ? (
                              <ChevronUp className="ml-2 h-4 w-4" />
                            ) : sorted === "desc" ? (
                              <ChevronDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-90" />
                            )}
                          </Button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
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
                  <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => {
                  const rowId = getRowId ? getRowId(row.original) : null;
                  const selected = Boolean(selectedRowId && rowId && rowId === selectedRowId);

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
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                    {emptyText}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Footer */}
      {(meta || pagination) && (
        <div className="bg-card p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: meta/info (mobile summary) */}
            <div className="text-xs text-muted-foreground">
              {meta?.searchable?.length ? (
                <div className="hidden">
                  Searchable:{" "}
                  <span className="font-medium">{meta.searchable.join(", ")}</span>
                </div>
              ) : null}

              {pagination?.totalCount != null ? (
                <div className="flex flex-col gap-1 sm:hidden">
                  <div>
                    Showing{" "}
                    <span className="font-medium">
                      {start}-{end}
                    </span>{" "}
                    of <span className="font-medium">{total}</span> records
                  </div>
                  <div>
                    Page <span className="font-medium">{currentPage}</span> /{" "}
                    <span className="font-medium">{totalPages}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right: controls + desktop summary */}
            {pagination ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                {/* Desktop summary */}
                {pagination?.totalCount != null ? (
                  <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                    <div>
                      Showing{" "}
                      <span className="font-medium">
                        {start}-{end}
                      </span>{" "}
                      of <span className="font-medium">{total}</span> records
                    </div>
                    <div className="hidden md:block">
                      Page <span className="font-medium">{currentPage}</span> /{" "}
                      <span className="font-medium">{totalPages}</span>
                    </div>
                  </div>
                ) : null}

                {/* Rows per page (desktop only) */}
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows:</span>

                  <Select
                    value={String(pagination.pageSize)}
                    onValueChange={(v) => pagination.onPageSizeChange(Number(v))}
                  >
                    <SelectTrigger className="h-9 w-[120px] sm:h-8 sm:w-[90px]">
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

                {/* Prev / Next */}
                <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-[48%] sm:h-8 sm:w-auto"
                    disabled={!canPrev || loading}
                    onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
                  >
                    <span className="sm:hidden">Prev</span>
                    <span className="hidden sm:inline">Prev</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-[48%] sm:h-8 sm:w-auto"
                    disabled={!canNext || loading}
                    onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
                  >
                    <span className="sm:hidden">Next</span>
                    <span className="hidden sm:inline">Next</span>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
