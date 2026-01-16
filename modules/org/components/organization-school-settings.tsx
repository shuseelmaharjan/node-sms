"use client";

import * as React from "react";
import {
    useMutation,
    useQuery,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";

import { api } from "@/api";
import { DataTable } from "@/components/data-table/DataTable";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/form/InputField";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { CrudTableFormShell } from "@/components/crud/CrudTableFormShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { PaginatedResponse } from "@/types/api";

import {
    organizationSchoolSettingsSchema,
    type OrganizationSchoolSettingsValues,
} from "../schema/organization-school-settings.schema";

import {
    organizationSchoolSettingsColumns,
    type SchoolSettingsEntity,
} from "../columns/organization-school-settings.columns";
import { Controller } from "react-hook-form";
import { SchoolSelectField, type SchoolOption } from "./SchoolSelectField";


const LIST_URL = "/api/v1/org/school-settings/";
const DETAIL_URL = (id: string) => `/api/v1/org/school-settings/${id}/`;

type Mode = { type: "create" } | { type: "edit"; id: string };

const createDefaults: OrganizationSchoolSettingsValues = {
    school: "",
    invoice_prefix: "",
    receipt_prefix: "",
    fiscal_year_label: "",
    late_fee_fixed: "",
    late_fee_percent: "",
    is_active: true,
};

function toDefaults(entity: SchoolSettingsEntity): OrganizationSchoolSettingsValues {
    return {
        school: entity.school ?? "",
        invoice_prefix: entity.invoice_prefix ?? "",
        receipt_prefix: entity.receipt_prefix ?? "",
        fiscal_year_label: entity.fiscal_year_label ?? "",
        late_fee_fixed: entity.late_fee_fixed ?? "",
        late_fee_percent: entity.late_fee_percent ?? "",
        is_active: Boolean(entity.is_active),
    };
}

function toOrdering(s: SortingState) {
    if (!s?.length) return "";
    return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function OrganizationSchoolSettingsCrudPage() {
    const qc = useQueryClient();
    const SCHOOLS_LIST_URL = "/api/v1/org/schools/";


    const [mode, setMode] = React.useState<Mode>({ type: "create" });
    const [deleteTarget, setDeleteTarget] =
        React.useState<SchoolSettingsEntity | null>(null);

    // search + pagination + sorting
    const [q, setQ] = React.useState("");
    const [pageIndex, setPageIndex] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const [pageSizeInitialized, setPageSizeInitialized] = React.useState(false);

    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "updated_at", desc: true },
    ]);

    // filters (kept same pattern as reference)
    const [filters, setFilters] = React.useState<Record<string, string>>({
        status: "all",
    });

    const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

    // LIST
    const listQuery = useQuery<PaginatedResponse<SchoolSettingsEntity>>({
        queryKey: [
            "org-school-settings",
            "list",
            { pageIndex, pageSize, q, ordering, filters },
        ],
        queryFn: async () => {
            const res = await api.get<PaginatedResponse<SchoolSettingsEntity>>(LIST_URL, {
                params: {
                    page: pageIndex + 1,
                    page_size: pageSize,
                    search: q || undefined,
                    ordering: ordering || undefined,
                    ...Object.fromEntries(
                        Object.entries(filters).filter(([_, v]) => v && v !== "all")
                    ),
                },
            });
            return res.data;
        },
        placeholderData: keepPreviousData,
    });

    // init default pageSize from API meta.page_size (ONCE)
    React.useEffect(() => {
        if (pageSizeInitialized) return;
        const apiPageSize = (listQuery.data as any)?.meta?.page_size;
        if (apiPageSize && apiPageSize > 0) {
            setPageSize(apiPageSize);
            setPageSizeInitialized(true);
        }
    }, [pageSizeInitialized, listQuery.data]);

    // reset to first page when query changes
    React.useEffect(() => {
        setPageIndex(0);
    }, [q, pageSize, filters, sorting]);

    // DETAIL
    const detailQuery = useQuery({
        queryKey: ["org-school-settings", "detail", mode.type === "edit" ? mode.id : null],
        enabled: mode.type === "edit",
        queryFn: async () => {
            const id = mode.type === "edit" ? mode.id : "";
            const res = await api.get<SchoolSettingsEntity>(DETAIL_URL(id));
            return res.data;
        },
    });
    const schoolsQuery = useQuery({
        queryKey: ["org-schools", "options"],
        queryFn: async () => {
            // fetch first 200 (adjust if needed)
            const res = await api.get(SCHOOLS_LIST_URL, {
                params: { page: 1, page_size: 200, ordering: "name" },
            });

            // your schools response shape
            const items = (res.data?.results ?? []) as any[];

            const options: SchoolOption[] = items.map((x) => ({
                id: x.id,
                code: x.code ?? "",
                name: x.name ?? "",
                is_active: Boolean(x.is_active),
            }));

            // nice UX: show active first, then by name
            options.sort((a, b) => {
                if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
                return (a.name || "").localeCompare(b.name || "");
            });

            return options;
        },
        staleTime: 60_000, // 1 min
    });


    // CREATE
    const createMutation = useMutation({
        mutationFn: async (values: OrganizationSchoolSettingsValues) => {
            const payload = {
                school: values.school,
                invoice_prefix: values.invoice_prefix,
                receipt_prefix: values.receipt_prefix,
                fiscal_year_label: values.fiscal_year_label,
                late_fee_fixed: values.late_fee_fixed,
                late_fee_percent: values.late_fee_percent,
                is_active: values.is_active,
            };
            const res = await api.post<SchoolSettingsEntity>(LIST_URL, payload);
            return res.data;
        },
        onSuccess: async () => {
            toast.success("School settings created");
            await qc.invalidateQueries({ queryKey: ["org-school-settings", "list"] });
            setMode({ type: "create" });
        },
        onError: (e: any) =>
            toast.error(e?.response?.data?.detail ?? "Failed to create"),
    });

    // UPDATE
    const updateMutation = useMutation({
        mutationFn: async (args: { id: string; values: OrganizationSchoolSettingsValues }) => {
            const payload = {
                school: args.values.school,
                invoice_prefix: args.values.invoice_prefix,
                receipt_prefix: args.values.receipt_prefix,
                fiscal_year_label: args.values.fiscal_year_label,
                late_fee_fixed: args.values.late_fee_fixed,
                late_fee_percent: args.values.late_fee_percent,
                is_active: args.values.is_active,
            };
            const res = await api.put<SchoolSettingsEntity>(DETAIL_URL(args.id), payload);
            return res.data;
        },
        onSuccess: async (entity) => {
            toast.success("School settings updated");
            await qc.invalidateQueries({ queryKey: ["org-school-settings", "list"] });
            qc.setQueryData(["org-school-settings", "detail", entity.id], entity);
        },
        onError: (e: any) =>
            toast.error(e?.response?.data?.detail ?? "Failed to update"),
    });

    // DELETE
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(DETAIL_URL(id));
        },
        onSuccess: async () => {
            toast.success("Deleted");
            await qc.invalidateQueries({ queryKey: ["org-school-settings", "list"] });
            setDeleteTarget(null);
            if (mode.type === "edit" && deleteTarget?.id === mode.id) {
                setMode({ type: "create" });
            }
        },
        onError: (e: any) =>
            toast.error(e?.response?.data?.detail ?? "Failed to delete"),
    });

    const blocked =
        listQuery.isFetching ||
        detailQuery.isFetching ||
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending;

    const pageData = listQuery.data as any;
    const rows = pageData?.results ?? [];
    const totalCount = pageData?.count ?? 0;
    const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

    const selectedEntity = mode.type === "edit" ? (detailQuery.data ?? null) : null;

    const defaultValues: OrganizationSchoolSettingsValues = React.useMemo(() => {
        if (mode.type === "edit" && selectedEntity) return toDefaults(selectedEntity);
        return createDefaults;
    }, [mode.type, selectedEntity]);

    const resetKey = React.useMemo(() => {
        if (mode.type === "create") return "create";
        return selectedEntity ? `edit-${mode.id}-ready` : `edit-${mode.id}-loading`;
    }, [mode, selectedEntity]);

    const columns = React.useMemo(
        () =>
            organizationSchoolSettingsColumns({
                onEdit: (row) => setMode({ type: "edit", id: row.id }),
                onDelete: (row) => setDeleteTarget(row),
            }),
        []
    );

    const filterable = pageData?.meta?.filterable ?? {};
    const hasFilterable = Object.keys(filterable).length > 0;

    return (
        <>
            <CrudTableFormShell
                title="School Settings"
                formTitle={
                    mode.type === "create"
                        ? "School Settings Setup"
                        : selectedEntity
                            ? `School Settings — ${selectedEntity.school_name ?? selectedEntity.school}`
                            : "School Settings Setup"
                }
                formDescription="Create or update school invoice/receipt prefixes, fiscal year, and late fee rules."
                form={
                    <FormWizard
                        schema={organizationSchoolSettingsSchema}
                        defaultValues={defaultValues}
                        resetKey={resetKey}
                        blocked={blocked}
                        externallyBlocked={false}
                        submitLoading={createMutation.isPending || updateMutation.isPending}
                        submitLabel={mode.type === "create" ? "Create" : "Update"}
                        disableSubmitUntilDirty={true}
                        onSubmit={async (values, methods) => {
                            if (mode.type === "create") {
                                await createMutation.mutateAsync(values);

                                // force empty form after successful create
                                setMode({ type: "create" });
                                qc.removeQueries({ queryKey: ["org-school-settings", "detail"] });

                                methods.reset(createDefaults, {
                                    keepDefaultValues: false,
                                    keepDirty: false,
                                    keepTouched: false,
                                    keepErrors: false,
                                });
                                return;
                            }

                            if (mode.type === "edit") {
                                await updateMutation.mutateAsync({ id: mode.id, values });

                                // force empty form after successful update
                                setMode({ type: "create" });
                                qc.removeQueries({ queryKey: ["org-school-settings", "detail"] });

                                methods.reset(createDefaults, {
                                    keepDefaultValues: false,
                                    keepDirty: false,
                                    keepTouched: false,
                                    keepErrors: false,
                                });
                                return;
                            }

                            methods.reset(createDefaults, { keepDefaultValues: true });
                        }}
                        render={(methods) => (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Controller
                                    control={methods.control}
                                    name="school"
                                    render={({ field, fieldState }) => (
                                        <SchoolSelectField
                                            label="School"
                                            required
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={schoolsQuery.data ?? []}
                                            disabled={blocked || schoolsQuery.isLoading}
                                            error={fieldState.error}
                                            placeholder={schoolsQuery.isLoading ? "Loading schools…" : "Select school…"}
                                            hideInactive={false}
                                            disableInactive={true}
                                        />
                                    )}
                                />



                                <InputField
                                    label="Fiscal Year Label"
                                    placeholder="81/82"
                                    required
                                    {...methods.register("fiscal_year_label")}
                                    error={methods.formState.errors.fiscal_year_label}
                                />

                                <InputField
                                    label="Invoice Prefix"
                                    placeholder="INV"
                                    required
                                    {...methods.register("invoice_prefix")}
                                    error={methods.formState.errors.invoice_prefix}
                                />

                                <InputField
                                    label="Receipt Prefix"
                                    placeholder="REC"
                                    required
                                    {...methods.register("receipt_prefix")}
                                    error={methods.formState.errors.receipt_prefix}
                                />

                                <InputField
                                    label="Late Fee Fixed"
                                    placeholder="100"
                                    required
                                    {...methods.register("late_fee_fixed")}
                                    error={methods.formState.errors.late_fee_fixed}
                                />

                                <InputField
                                    label="Late Fee Percent"
                                    placeholder="10"
                                    required
                                    {...methods.register("late_fee_percent")}
                                    error={methods.formState.errors.late_fee_percent}
                                />

                                {/* keep same pattern as reference for boolean */}
                                <input
                                    type="hidden"
                                    value={methods.watch("is_active") ? "true" : "false"}
                                />
                            </div>
                        )}
                    />
                }
                tableTitle="School Settings List"
                tableToolbar={
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search…"
                                className="pl-8"
                            />
                        </div>

                        {hasFilterable ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" disabled={blocked}>
                                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                                        Filter
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-64">
                                    <DropdownMenuLabel>Filters</DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {Object.entries(filterable).map(([key, cfg]) => {
                                        const choices = (cfg as any)?.choices ?? [];
                                        const current = filters[key] ?? "all";

                                        return (
                                            <div key={key} className="px-2 py-2">
                                                <div className="mb-2 text-xs font-medium text-muted-foreground">
                                                    {key}
                                                </div>

                                                <DropdownMenuRadioGroup
                                                    value={current}
                                                    onValueChange={(v) =>
                                                        setFilters((prev) => ({ ...prev, [key]: v }))
                                                    }
                                                >
                                                    <DropdownMenuRadioItem value="all">
                                                        all
                                                    </DropdownMenuRadioItem>

                                                    {choices
                                                        .filter((c: string) => c !== "all")
                                                        .map((c: string) => (
                                                            <DropdownMenuRadioItem key={c} value={c}>
                                                                {c}
                                                            </DropdownMenuRadioItem>
                                                        ))}
                                                </DropdownMenuRadioGroup>
                                            </div>
                                        );
                                    })}

                                    <DropdownMenuSeparator />
                                    <div className="flex justify-end gap-2 p-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFilters({ status: "all" })}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Clear
                                        </Button>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                qc.invalidateQueries({ queryKey: ["org-school-settings", "list"] })
                            }
                            disabled={blocked}
                            className="sm:w-auto"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                }
                table={
                    <DataTable<SchoolSettingsEntity>
                        data={rows}
                        columns={columns}
                        loading={listQuery.isLoading}
                        emptyText={listQuery.isError ? "Failed to load." : "No settings yet."}
                        sorting={sorting}
                        onSortingChange={setSorting}
                        pagination={{
                            pageIndex,
                            pageSize,
                            pageCount,
                            totalCount,
                            currentPage: pageData?.meta?.page,
                            onPageChange: setPageIndex,
                            onPageSizeChange: (n) => {
                                setPageSizeInitialized(true);
                                setPageSize(n);
                                setPageIndex(0);
                            },
                        }}
                        meta={{
                            searchable: pageData?.meta?.searchable ?? [],
                        }}
                    />
                }
            />

            <ConfirmDeleteDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(v) => !v && setDeleteTarget(null)}
                loading={deleteMutation.isPending}
                title="Delete these school settings?"
                description="This action can’t be undone."
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    await deleteMutation.mutateAsync(deleteTarget.id);
                }}
            />
        </>
    );
}
