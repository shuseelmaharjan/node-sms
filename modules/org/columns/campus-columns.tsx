"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Campus } from "../types/campuses.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function createCampusColumns(opts: {
  onEdit: (row: Campus) => void;
  onDelete: (row: Campus) => void;
}): ColumnDef<Campus>[] {
  return [
    { accessorKey: "name", header: "Campus" },
    { accessorKey: "address", header: "Address" },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) =>
        row.original.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => opts.onEdit(row.original)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => opts.onDelete(row.original)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];
}
