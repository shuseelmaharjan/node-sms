// modules/teachers/columns/teacher.columns.tsx
"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { RowActionsDropdown } from "@/components/data-table/RowActionsDropdown";
import type { TeacherListRow } from "../types/teacher.types";

export function teacherColumns(): ColumnDef<TeacherListRow>[] {
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
      header: "Teacher",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium max-w-[240px] truncate">
            {row.original.full_name}
          </span>
          <span className="text-xs text-muted-foreground max-w-[240px] truncate">
            {row.original.phone || "-"}
            {row.original.email ? ` • ${row.original.email}` : ""}
          </span>
        </div>
      ),
    },
    {
      id: "teacher_level",
      header: "Level",
      enableSorting: false,
      cell: ({ row }) => row.original.specialization?.teacher_level ?? "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => row.original.status ?? "-",
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => <TeacherRowActions row={row.original} />,
    },
  ];
}

function TeacherRowActions({ row }: { row: TeacherListRow }) {
  const router = useRouter();

  return (
    // ✅ stop row click selection/navigation if table has onRowClick
    <div onClick={(e) => e.stopPropagation()}>
      <RowActionsDropdown<TeacherListRow>
        row={row}
        label="Actions"
        items={[
          {
            key: "view",
            label: "View details",
            icon: <Eye className="h-4 w-4" />,
            // ✅ Option 1 (recommended if your optimized RowActionsDropdown supports href):
            href: (r) => `/teachers/${r.id}`,

            // ✅ Option 2 (works with your current dropdown too, keep only one):
            // onSelect: (r) => router.push(`/teachers/${r.id}`),
          },

          // Future options (kept disabled for now)
          {
            key: "edit",
            label: "Edit",
            icon: <Pencil className="h-4 w-4" />,
            disabled: true,
            separatorBefore: true,
            // onSelect: (r) => router.push(`/teachers/${r.id}/edit`),
          },
          {
            key: "delete",
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive",
            disabled: true,
            // onSelect: async (r) => { ... },
          },
        ]}
      />
    </div>
  );
}
