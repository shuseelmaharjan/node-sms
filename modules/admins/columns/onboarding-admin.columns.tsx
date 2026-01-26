// modules/admin/columns/onboarding-admin.columns.tsx
"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type FileEntity = {
  id: string;
  file_url: string;
  file_type: string;
  original_name?: string;
};

export type OnboardingAdminEntity = {
  serial?: number;

  user: {
    id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    phone: string;
    email: string;
    username?: string;
    role?: string;
    status?: string;
  };

  school: {
    id: string;
    code: string;
    name: string;
    address: string;
    phone: string;
    email: string;

    logo_file?: FileEntity | null;
    pan_document_file?: FileEntity | null;
    registration_document_file?: FileEntity | null;

    pan_number?: string;
    registration_number?: string;
    is_active?: boolean;
  };

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
  } | null;

  addresses?: Array<{
    id?: string;
    address_type: "permanent" | "temporary";
    country: string;
    province: string;
    district: string;
    municipality: string;
    ward_no: string;
    street?: string;
    tole: string;
    house_no?: string;
    postal_code?: string;
    is_primary?: boolean;
  }>;

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
};

export function onboardingAdminColumns(args: {
  onEdit: (row: OnboardingAdminEntity) => void;
  onDelete: (row: OnboardingAdminEntity) => void;
}): ColumnDef<OnboardingAdminEntity>[] {
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
      id: "first_name",
      header: "Name",
      enableSorting: true,
      accessorFn: (row) => row.user.first_name,
      cell: ({ row }) => {
        const u = row.original.user;
        const full = [u.first_name, u.middle_name, u.last_name]
          .filter(Boolean)
          .join(" ");
        return <span className="flex flex-col gap-1">
          <span className="font-medium">{full}</span>
          <span>{row.original.user.phone}</span>
        </span>;
      },
    },

    {
      id: "email",
      header: "Email",
      enableSorting: true,
      accessorFn: (row) => row.user.email,
      cell: ({ row }) => row.original.user.email,
    },
    {
      accessorKey: "user.status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const v = (row.original.user.status ?? "").toLowerCase();
        const isActive = v === "active";
        return (
          <Badge variant={isActive ? "active" : "inactive"}>
            {row.original.user.status ?? "-"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "user.username",
      header: "Username",
      enableSorting: false,
      cell: ({ row }) => {
        return(
          <span className="flex flex-col gap-1">
            <span className="font-mono">{row.original.user.username ?? "-"}</span>
              {/* <span>{row.original.user.role ?? "-"}</span> */}
              <Badge variant={row.original.user.role ? row.original.user.role.toLowerCase() as any : "other"}>
                {row.original.user.role ?? "-"}
              </Badge>
          </span>
        )
      },
    },
    {
      accessorKey: "school.name",
      header: "School Name",
      enableSorting: false,
      cell: ({ row }) => {
        return(
          <span className="flex flex-col gap-1">
            <span className="font-medium">{row.original.school?.name ?? "-"}</span>
            <span>{row.original.school?.code ?? "-"}</span>
          </span>
        )
      },
    },
    {
      accessorKey: "school.address",
      header: "School Address",
      enableSorting: false,
      cell: ({ row }) => row.original.school?.address ?? "-",
    },
    {
      accessorKey: "school.email",
      header: "School Email",
      enableSorting: false,
      cell: ({ row }) => {
        return(
          <span className="flex flex-col gap-1">
            <span>{row.original.school?.email ?? "-"}</span>
            <span>{row.original.school?.phone ?? "-"}</span>
          </span>
        )
      },
    },
    {
      id: "school_logo",
      header: "School Logo",
      enableSorting: false,
      cell: ({ row }) => {
        const logoUrl = row.original.school?.logo_file?.file_url;
        return logoUrl ? (
          <img
              src={logoUrl}
              alt="School Logo"
              className="h-10 w-10 rounded object-cover border"
              loading="lazy"
            />
        ) : (
          "-"
        );
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
