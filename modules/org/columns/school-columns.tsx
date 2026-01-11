"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { School } from "../types/schools.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function createSchoolColumns(opts: {
  onEdit: (row: School) => void;
  onDelete: (row: School) => void;
}): ColumnDef<School>[] {
  return [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "name", header: "School Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "timezone", header: "Timezone" },
    { accessorKey: "currency", header: "Currency" },
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
