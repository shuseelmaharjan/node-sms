"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// CHANGE THIS IMPORT to your actual util path/name
// Example possibilities you might have:
// import { formatDateShort } from "@/lib/text-utils";
// import { formatDate } from "@/lib/text-utils";
import { formatDateShort } from "@/lib/text-utils";

export type SchoolEntity = {
  id: string;
  serial?: number;

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
    // serial
    {
      accessorKey: "serial",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{row.original.serial ?? "-"}.</span>,
    },

    // logo_file
    {
      id: "logo_file",
      header: "Logo",
      enableSorting: false,
      cell: ({ row }) => {
        const url = row.original.logo_file?.file_url ?? "";
        const name = row.original.name ?? "School";
        const fallback = (name || "S").trim().slice(0, 1).toUpperCase();

        return (
          <Avatar className="h-9 w-9">
            <AvatarImage src={url} alt={`${name} logo`} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
        );
      },
    },

    // code (sortable)
    {
      accessorKey: "code",
      header: "Code",
      enableSorting: true,
      cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
    },

    // name (sortable)
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => row.original.name,
    },

    // address
    {
      accessorKey: "address",
      header: "Address",
      enableSorting: false,
      cell: ({ row }) => row.original.address || "-",
    },

    // phone
    {
      accessorKey: "phone",
      header: "Phone",
      enableSorting: false,
      cell: ({ row }) => row.original.phone || "-",
    },

    // email
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: false,
      cell: ({ row }) => row.original.email || "-",
    },

    // is_active as Badge status
    {
      accessorKey: "is_active",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const active = Boolean(row.original.is_active);
        return (
          <Badge variant={active ? "active" : "inactive"}>
            {active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },

    // created_at formatted like "Jan 1, 2026" (sortable if backend supports)
    {
      accessorKey: "created_at",
      header: "Created",
      enableSorting: true,
      cell: ({ row }) => {
        const v = row.original.created_at;
        // formatDateShort should output "Jan 1, 2026"
        // If your util expects Date, pass new Date(v)
        return v ? formatDateShort(v) : "-";
      },
    },

    // actions
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => args.onEdit(row.original)}>
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
