"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/text-utils";
import { toSentenceCase } from "@/utils/text-utils";

type FeeHeadDetail = {
    id: string;
    name: string;
    code: string;
    group: string;
};

type SchoolDetail = {
    id: string;
    name: string;
    code: string;
};

type BatchDetail = {
    id: number;
    name: string;
    end_date_ad?: string;
    end_date_bs?: string;
};

type AcademicClassDetail = {
    id: string;
    name: string;
};

export type FeeStructureEntity = {
    serial?: number;

    id: string;

    // ids
    fee_head: string;
    school: string;
    batch: number | null;
    academic_class: string | null;

    // details (from backend)
    fee_head_detail?: FeeHeadDetail | null;
    school_detail?: SchoolDetail | null;
    batch_detail?: BatchDetail | null;
    academic_class_detail?: AcademicClassDetail | null;

    amount: string;
    currency: "NPR" | string;
    period: string;
    status: string;
    upgrade_impact: boolean;
    scope: string;
    tax_included: boolean;

    created_at: string;
    updated_at: string;
};

export function feeStructureColumns(args: {
    onEdit: (row: FeeStructureEntity) => void;
    onDelete: (row: FeeStructureEntity) => void;
}): ColumnDef<FeeStructureEntity>[] {
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
            id: "fee_head",
            header: "Fee Head",
            enableSorting: false,
            cell: ({ row }) => {
                const r = row.original;
                const feeName = r.fee_head_detail?.name ?? r.fee_head;
                // const feeCode = r.fee_head_detail?.code ?? "";

                return (
                    <div className="flex flex-col">
                        <span className="font-medium max-w-[260px] truncate">{feeName}</span>
                        <span className="text-xs text-muted-foreground max-w-[260px] truncate">
                            {/* {feeCode ? `${feeCode} • ` : ""} */}
                            {r.scope ? r.scope === "GLOBAL" ? "Global" : "Specific" : ""}• {toSentenceCase(r.period)}
                        </span>
                    </div>
                );
            },
        },

        {
            id: "amount",
            header: "Amount",
            enableSorting: true,
            accessorFn: (r) => Number(r.amount || 0),
            cell: ({ row }) => (
                <span className="tabular-nums whitespace-nowrap">
                    {row.original.amount} {row.original.currency}
                </span>
            ),
        },

        {
            accessorKey: "status",
            header: "Status",
            enableSorting: false,
            cell: ({ row }) => (
                <Badge variant={row.original.status === "active" ? "active" : "inactive"}>
                    {row.original.status}
                </Badge>
            ),
        },

        {
            accessorKey: "scope",
            header: "Scope",
            enableSorting: false,
            cell: ({ row }) => (
                <span className="whitespace-nowrap">{row.original.scope === "GLOBAL" ? "Global" : "Specific"}</span>
            ),
        },

        {
            id: "applies_to",
            header: "Applies To",
            enableSorting: false,
            cell: ({ row }) => {
                const r = row.original;

                const batchLabel =
                    r.scope === "GLOBAL"
                        ? "All batches"
                        : r.batch_detail?.name ??
                        (r.batch != null ? `Batch #${r.batch}` : "-");

                const classLabel =
                    r.scope === "GLOBAL"
                        ? "All classes"
                        : r.academic_class_detail?.name ??
                        (r.academic_class ? r.academic_class : "-");

                return (
                    <div className="flex flex-col">
                        <span className="text-sm max-w-[240px] truncate">{batchLabel}</span>
                        <span className="text-xs text-muted-foreground max-w-[240px] truncate">
                            {classLabel}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "upgrade_impact",
            header: "Upgrade Impact",
            enableSorting: false,
            cell: ({ row }) => {
                const impact = row.original.upgrade_impact;

                const base =
                    "inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium";

                const cls = impact
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-900/50"
                    : "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-200 dark:border-zinc-800";

                return (
                    <span className={`${base} ${cls}`}>
                        {impact ? "Upgrade Sensitive" : "Stable"}
                    </span>
                );
            },
        },

        {
            id: "tax_included",
            header: "Tax",
            enableSorting: false,
            cell: ({ row }) => {
                const included = row.original.tax_included;

                const base =
                    "inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium";

                const cls = included
                    ? "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-200 dark:border-pink-900/50"
                    : "bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-900/40 dark:text-stone-200 dark:border-stone-800";

                return <span className={`${base} ${cls}`}>{included ? "Included" : "Excluded"}</span>;
            },
        },
        {
            accessorKey: "batch_detail",
            header: "Batch",
            enableSorting: false,
            cell: ({ row }) => {
                const r = row.original;
                if (r.scope === "GLOBAL") {
                    return <span className="text-muted-foreground">-</span>;
                }
                return (
                    <span className="max-w-[220px] truncate">
                        {r.batch_detail?.name ?? (r.batch != null ? `Batch #${r.batch}` : "-")}
                    </span>
                );
            },
        },
        {
            accessorKey: "period",
            header: "Period",
            enableSorting: true,
            cell: ({ row }) => <span>{toSentenceCase(row.original.period)}</span>,
        },

        // {
        //   id: "school",
        //   header: "School",
        //   enableSorting: false,
        //   cell: ({ row }) => {
        //     const s = row.original.school_detail;
        //     if (!s) return <span className="text-muted-foreground">-</span>;
        //     return (
        //       <div className="flex flex-col">
        //         <span className="text-sm max-w-[220px] truncate">{s.name}</span>
        //         <span className="text-xs text-muted-foreground">{s.code}</span>
        //       </div>
        //     );
        //   },
        // },

        {
            accessorKey: "created_at",
            header: "Created",
            enableSorting: true,
            cell: ({ row }) => <span>{formatDateShort(row.original.created_at)}</span>,
        },
        {
            accessorKey: "end_date_ad",
            header: "Validity",
            enableSorting: false,
            cell: ({ row }) => {
                const batch = row.original.batch_detail;

                const base =
                    "inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium";

                // No batch → No validity
                if (!batch) {
                    return (
                        <span className={`${base} bg-gray-50 text-gray-700 border-gray-200`}>
                            No validity
                        </span>
                    );
                }

                const endAd = batch.end_date_ad;
                const endBs = batch.end_date_bs;

                if (!endAd || !endBs) {
                    return <span className="text-muted-foreground">-</span>;
                }

                const today = new Date();
                const endDate = new Date(`${endAd}T00:00:00`);
                const diffDays = Math.ceil(
                    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );

                const oneMonth = 30;
                const twoMonths = 60;

                let cls = `${base} bg-violet-50 text-violet-700 border-violet-200`; // safe (>2 months)

                if (diffDays <= oneMonth) {
                    cls = `${base} bg-orange-50 text-orange-700 border-orange-200`; // near expiry
                } else if (diffDays <= twoMonths) {
                    cls = `${base} bg-sky-50 text-sky-700 border-sky-200`; // mid
                }

                return (
                    <div className="flex">
                        <span className={cls}>{endBs}</span>
                    </div>
                );
            },
        },


        {
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row }) => {
                const item = row.original;
                const canModify = item.status === "active";

                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={!canModify}
                            onClick={() => {
                                if (!canModify) return;
                                args.onEdit(item);
                            }}
                            className={!canModify ? "cursor-not-allowed opacity-60" : ""}
                            title={!canModify ? "Only ACTIVE records can be updated." : "Edit"}
                        >
                            Edit
                        </Button>

                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canModify}
                            onClick={() => {
                                if (!canModify) return;
                                args.onDelete(item);
                            }}
                            className={!canModify ? "cursor-not-allowed opacity-60" : ""}
                            title={!canModify ? "Only ACTIVE records can be deleted." : "Delete"}
                        >
                            Delete
                        </Button>
                    </div>
                );
            },
        },
        
    ];
}
