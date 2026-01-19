"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type RoleEntity = {
  id: string;
  serial?: number;

  school_id: string; // "*" or UUID depending on your backend
  code: string;
  name: string;
  is_system: boolean;

  // if your backend includes created_at, you can add it here + column
  // created_at?: string;
};

export function rolesColumns(args: {
  onEdit: (row: RoleEntity) => void;
  onDelete: (row: RoleEntity) => void;
}): ColumnDef<RoleEntity>[] {
  return [
    {
      accessorKey: "serial",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.serial ?? "-"}.</span>
      ),
    },

    {
      accessorKey: "code",
      header: "Code",
      enableSorting: true,
      cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
    },

    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => row.original.name,
    },

    {
      accessorKey: "school_id",
      header: "School",
      enableSorting: false,
      cell: ({ row }) => row.original.school_id || "-",
    },

    {
      accessorKey: "is_system",
      header: "System",
      enableSorting: false,
      cell: ({ row }) => {
        const v = Boolean(row.original.is_system);
        return <Badge variant={v ? "default" : "secondary"}>{v ? "Yes" : "No"}</Badge>;
      },
    },

    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => args.onEdit(row.original)}
          >
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => args.onDelete(row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];
}
