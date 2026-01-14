"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

export type SchoolEntity = {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
  logo_file?: {
    id: string;
    file_url: string;
    file_type: string;
    original_name: string;
    size_bytes: number;
    is_temporary: boolean;
    meta: any;
    uploaded_at: string;
  } | null;
};

export function organizationSchoolsColumns(args: {
  onEdit: (row: SchoolEntity) => void;
  onDelete: (row: SchoolEntity) => void;
}): ColumnDef<SchoolEntity>[] {
  return [
    {
      header: "Code",
      cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
    },
    {
      header: "Name",
      cell: ({ row }) => row.original.name,
    },
    {
      header: "Active",
      cell: ({ row }) => (row.original.is_active ? "Yes" : "No"),
    },
    {
      header: "Actions",
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
