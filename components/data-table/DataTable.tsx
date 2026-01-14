"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
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

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, any>[];
  className?: string;

  loading?: boolean;
  emptyText?: string;

  onRowClick?: (row: T) => void;

  /** Optional external toolbar (search, filters, create button etc.) */
  toolbar?: React.ReactNode;

  /** Optional: highlight a row (e.g. selected record) */
  getRowId?: (row: T) => string;
  selectedRowId?: string | null;
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
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const colCount = table.getAllLeafColumns().length;

  return (
    <div className={cn("space-y-3", className)}>
      {toolbar ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {toolbar}
        </div>
      ) : null}

      {/* Mobile-friendly horizontal scroll */}
      <ScrollArea className="w-full rounded border">
        <div className="min-w-[720px]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap bg-primary text-primary-foreground">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
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
    </div>
  );
}
