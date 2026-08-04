"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { RowActionsDropdown } from "@/components/data-table/RowActionsDropdown";
import { Badge, normalizeVariant } from "@/components/ui/badge";
import type { Student360ListRow } from "../types/student360.types";
import { toSentenceCase } from "@/utils/text-utils";

export function student360Columns(): ColumnDef<Student360ListRow>[] {
  return [
    {
      accessorKey: "serial",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.serial ?? "-"}</span>
      ),
    },
    {
      accessorKey: "full_name",
      header: "Student",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium max-w-[280px] truncate">
              {r.full_name || "-"}
            </span>
            <span className="text-xs text-muted-foreground max-w-[280px] truncate">
              @{r.username || "-"}
              {r.current_enrollment?.batch_name ? ` • ${r.current_enrollment.batch_name}` : ""}
              {r.current_enrollment?.class_name ? ` • ${r.current_enrollment.class_name}` : ""}
              {r.current_enrollment?.section_name ? ` • ${r.current_enrollment.section_name}` : ""}
            </span>
          </div>
        );
      },
    },
    {
      id: "enrollment_status",
      header: "Enrollment",
      enableSorting: false,
      cell: ({ row }) => {
        const ce = row.original.current_enrollment;
        return ce ? (
          <Badge variant={normalizeVariant(ce.status)} label={toSentenceCase(ce.status)} />
        ) : (
          <span className="text-muted-foreground text-sm">Pending</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "User Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          variant={normalizeVariant(row.original.status)}
          label={toSentenceCase(row.original.status)}
        />
      ),
    },
    {
      id: "batches",
      header: "Batches",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {/* {row.original.batches_meta?.count ?? 0} */}
          {row.original.current_enrollment?.batch_name ? ` ${row.original.current_enrollment.batch_name}` : ""}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => <Student360RowActions row={row.original} />,
    },
  ];
}

function Student360RowActions({ row }: { row: Student360ListRow }) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <RowActionsDropdown<Student360ListRow>
        row={row}
        label="Actions"
        items={[
          {
            key: "view",
            label: "View Details",
            icon: <Eye className="h-4 w-4" />,
            href: (r) => `/students/${r.id}`,
          },
        ]}
      />
    </div>
  );
}
