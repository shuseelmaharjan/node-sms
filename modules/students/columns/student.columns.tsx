// modules/students/columns/student.columns.tsx
"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toSentenceCase } from "@/utils/text-utils";

export type FileEntity = {
  id: string;
  file_url: string;
  file_type: string;
  original_name?: string;
};

export type StudentEntity = {
  serial?: number;
  id: string;

  first_name: string;
  middle_name?: string;
  last_name: string;
  phone: string;
  email?: string;
  username?: string;
  role?: string;
  status?: string;

  profile?: {
    id: string;
    date_of_birth_in_ad?: string | null;
    date_of_birth_in_bs?: string | null;
    gender?: string | null;
    blood_group?: string | null;
    nationality?: string | null;
    religion?: string | null;
    mother_tongue?: string | null;
    citizenship_no?: string | null;
    pan_no?: string | null;

    addresses?: Array<any>;

    documents?: Record<
      string,
      {
        id: string;
        document_type: string;
        file?: FileEntity | null;
        remarks?: string | null;
        issued_by?: string | null;
        issued_date?: string | null;
        expiry_date?: string | null;
        created_at?: string | null;
      }
    > | null;

    other_info?: any;
  } | null;
};

export function studentColumns(args: {
  onEdit: (row: StudentEntity) => void;
  onDelete: (row: StudentEntity) => void;
}): ColumnDef<StudentEntity>[] {
  return [
    {
      accessorKey: "serial",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{row.original.serial ?? "-"}.</span>,
    },
    {
      id: "first_name",
      header: "Name",
      enableSorting: true,
      accessorFn: (row) => row.first_name,
      cell: ({ row }) => {
        const u = row.original;
        const full = [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" ");
        return (
          <span className="flex flex-col gap-1">
            <span className="font-medium max-w-[150px] truncate">{full}</span>
            <span>{u.phone}</span>
          </span>
        );
      },
    },
    // {
    //   id: "email",
    //   header: "Email",
    //   enableSorting: true,
    //   accessorFn: (row) => row.email || "",
    //   cell: ({ row }) => (
    //     <div className="max-w-[200px] truncate" title={row.original.email || ""}>
    //       {row.original.email || "-"}
    //     </div>
    //   ),
    // },
    {
      accessorKey: "username",
      header: "Username",
      enableSorting: true,
      cell: ({ row }) => <span className="font-mono">{row.original.username ?? "-"}</span>,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      enableSorting: false,
      cell: ({ row }) => <span>{row.original.profile
        ? toSentenceCase(row.original.profile.gender) ?? "-"
        : "-"}</span>,
    },
    {
      accessorKey: "date_of_birth_in_bs",
      header: "Date of Birth (B.S.)",
      enableSorting: false,
      cell: ({ row }) => <span className="font-mono">{row.original.profile?.date_of_birth_in_bs ?? "-"}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const v = (row.original.status ?? "").toLowerCase();
        const isActive = v === "active";
        return <Badge variant={isActive ? "active" : "inactive"}>{row.original.status ?? "-"}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => args.onEdit(row.original)}>
            Edit
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={() => args.onDelete(row.original)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];
}
