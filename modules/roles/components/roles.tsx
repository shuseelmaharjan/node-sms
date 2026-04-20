"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";

import { api } from "@/api";
import { DataTable } from "@/components/data-table/DataTable";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
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
    rolesSchema,
    type RoleValues,
} from "../schema/roles.schema";
import {
    rolesColumns,
    type RoleEntity,
} from "../columns/roles.columns";
import { SchoolSelectQueryField } from "./SchoolSelectQueryField";
import { Checkbox } from "@/components/ui/checkbox";

const LIST_URL = "/api/v1/accounts/roles/";
const DETAIL_URL = (id: string) => `/api/v1/accounts/roles/${id}/`;

type Mode = { type: "create" } | { type: "edit"; id: string };

const createDefaults: RoleValues = {
    school_id: "*",
    code: "",
    name: "",
    is_system: false,
};

function toDefaults(entity: RoleEntity): RoleValues {
    return {
        school_id: entity.school_id ?? "*",
        code: entity.code ?? "",
        name: entity.name ?? "",
        is_system: Boolean(entity.is_system),
    };
}

function toOrdering(s: SortingState) {
    if (!s?.length) return "";
    return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function RolesCrudPage() {
    const qc = useQueryClient();

    const [mode, setMode] = React.useState<Mode>({ type: "create" });
    const [deleteTarget, setDeleteTarget] = React.useState<RoleEntity | null>(null);

    // search + pagination + sorting
    const [q, setQ] = React.useState("");
    const [pageIndex, setPageIndex] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);

    const [pageSizeInitialized, setPageSizeInitialized] = React.useState(false);

    // If backend supports ordering by created_at, use it. If not, change to "name" or remove sorting.
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "name", desc: false },
    ]);

    // optional filters (kept to match your reference)
    const [filters, setFilters] = React.useState<Record<string, string>>({
        system: "all", // "all" | "true" | "false"
    });

    const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

    // LIST
    const listQuery = useQuery<PaginatedResponse<RoleEntity>>({
        queryKey: ["account-roles", "list", { pageIndex, pageSize, q, ordering, filters }],
        queryFn: async () => {
            const res = await api.get<PaginatedResponse<RoleEntity>>(LIST_URL, {
                params: {
                    page: pageIndex + 1,
                    page_size: pageSize,
                    search: q || undefined,
                    ordering: ordering || undefined,
                    // example filter mapping; update based on your backend filter params
                    is_system:
                        filters.system === "all" ? undefined : filters.system === "true",
                },
            });
            return res.data;
        },
        placeholderData: keepPreviousData,
    });

    // init default pageSize from API meta.page_size (ONCE) if your backend sends meta like Schools
    React.useEffect(() => {
        if (pageSizeInitialized) return;
        const apiPageSize = listQuery.data?.meta?.page_size;
        if (apiPageSize && apiPageSize > 0) {
            setPageSize(apiPageSize);
            setPageSizeInitialized(true);
        }
    }, [pageSizeInitialized, listQuery.data?.meta?.page_size]);

    // reset to first page when query changes
    React.useEffect(() => {
        setPageIndex(0);
    }, [q, pageSize, filters, sorting]);

    // DETAIL
    const detailQuery = useQuery({
        queryKey: ["account-roles", "detail", mode.type === "edit" ? mode.id : null],
        enabled: mode.type === "edit",
        queryFn: async () => {
            const id = mode.type === "edit" ? mode.id : "";
            const res = await api.get<RoleEntity>(DETAIL_URL(id));
            return res.data;
        },
    });

    // CREATE
    const createMutation = useMutation({
        mutationFn: async (values: RoleValues) => {
            const payload = {
                school_id: values.school_id,
                code: values.code,
                name: values.name,
                is_system: values.is_system,
            };
            const res = await api.post<RoleEntity>(LIST_URL, payload);
            return res.data;
        },
        onSuccess: async () => {
            toast.success("Role created");
            await qc.invalidateQueries({ queryKey: ["account-roles", "list"] });

            setMode({ type: "create" });
        },
        onError: (e: any) =>
            toast.error(e?.response?.data?.detail ?? "Failed to create role"),
    });

    // UPDATE
    const updateMutation = useMutation({
        mutationFn: async (args: { id: string; values: RoleValues }) => {
            const payload = {
                school_id: args.values.school_id,
                code: args.values.code,
                name: args.values.name,
                is_system: args.values.is_system,
            };
            const res = await api.put<RoleEntity>(DETAIL_URL(args.id), payload);
            return res.data;
        },
        onSuccess: async (entity) => {
            toast.success("Role updated");
            await qc.invalidateQueries({ queryKey: ["account-roles", "list"] });
            qc.setQueryData(["account-roles", "detail", entity.id], entity);
        },
        onError: (e: any) =>
            toast.error(e?.response?.data?.detail ?? "Failed to update role"),
    });

    // DELETE
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(DETAIL_URL(id));
        },
        onSuccess: async () => {
            toast.success("Deleted");
            await qc.invalidateQueries({ queryKey: ["account-roles", "list"] });
            setDeleteTarget(null);
            if (mode.type === "edit" && deleteTarget?.id === mode.id) {
                setMode({ type: "create" });
            }
        },
        onError: (e: any) =>
            toast.error(e?.response?.data?.detail ?? "Failed to delete role"),
    });

    const blocked =
        listQuery.isFetching ||
        detailQuery.isFetching ||
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending;

    const pageData = listQuery.data;
    const rows = pageData?.results ?? [];
    const totalCount = pageData?.count ?? 0;
    const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

    const selectedEntity = mode.type === "edit" ? detailQuery.data ?? null : null;

    const defaultValues: RoleValues = React.useMemo(() => {
        if (mode.type === "edit" && selectedEntity) return toDefaults(selectedEntity);
        return createDefaults;
    }, [mode.type, selectedEntity]);

    const resetKey = React.useMemo(() => {
        if (mode.type === "create") return "create";
        return selectedEntity ? `edit-${mode.id}-ready` : `edit-${mode.id}-loading`;
    }, [mode, selectedEntity]);

    const columns = React.useMemo(
        () =>
            rolesColumns({
                onEdit: (row) => setMode({ type: "edit", id: row.id }),
                onDelete: (row) => setDeleteTarget(row),
            }),
        []
    );

    // If your backend provides filterable meta like Schools, use it. Otherwise keep simple.
    const filterable = pageData?.meta?.filterable ?? null;
    const hasFilterable = Boolean(filterable && Object.keys(filterable).length);

    return (
        <>
            <CrudTableFormShell
                title="Roles"
                formTitle={
                    mode.type === "create"
                        ? "Role Setup"
                        : selectedEntity
                            ? `Role Setup — ${selectedEntity.name}`
                            : "Role Setup"
                }
                formDescription="Create or update roles."
                form={
                    <FormWizard
                        schema={rolesSchema}
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

                                setMode({ type: "create" });
                                qc.removeQueries({ queryKey: ["account-roles", "detail"] });

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

                                setMode({ type: "create" });
                                qc.removeQueries({ queryKey: ["account-roles", "detail"] });

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
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                <div className="lg:col-span-12 space-y-6">
                                    <Controller
                                        control={methods.control}
                                        name="school_id"
                                        render={({ field, fieldState }) => (
                                            <SchoolSelectQueryField
                                                label="School"
                                                required
                                                value={field.value || "*"}
                                                onChange={field.onChange}
                                                error={fieldState.error}
                                                includeAll={true}
                                                allLabel="All"
                                                allValue="*"
                                                hideInactive={false}
                                                disableInactive={true}
                                                placeholder="Select school…"
                                                disabled={blocked}
                                            />
                                        )}
                                    />

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <InputField
                                            label="Code"
                                            required
                                            {...methods.register("code")}
                                            error={methods.formState.errors.code}
                                        />
                                        <InputField
                                            label="Name"
                                            required
                                            {...methods.register("name")}
                                            error={methods.formState.errors.name}
                                        />
                                    </div>

                                    <Controller
                                        control={methods.control}
                                        name="is_system"
                                        render={({ field }) => (
                                            <input type="hidden" value={field.value ? "true" : "false"} />
                                        )}
                                    />

                                    {/* If you want a real checkbox/switch, replace hidden input with your Switch component. */}
                                    <Controller
                                        control={methods.control}
                                        name="is_system"
                                        render={({ field }) => (
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="is_system"
                                                    checked={Boolean(field.value)}
                                                    onCheckedChange={(checked) =>
                                                        field.onChange(Boolean(checked))
                                                    }
                                                    disabled={blocked}
                                                />
                                                <label
                                                    htmlFor="is_system"
                                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    System role
                                                </label>
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    />
                }
                tableTitle="Roles List"
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

                        {/* Simple filter (works even without meta.filterable) */}
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

                                <div className="px-2 py-2">
                                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                                        is_system
                                    </div>

                                    <DropdownMenuRadioGroup
                                        value={filters.system}
                                        onValueChange={(v) =>
                                            setFilters((prev) => ({ ...prev, system: v }))
                                        }
                                    >
                                        <DropdownMenuRadioItem value="all">all</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="true">true</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="false">false</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </div>

                                <DropdownMenuSeparator />
                                <div className="flex justify-end gap-2 p-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFilters({ system: "all" })}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Clear
                                    </Button>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                qc.invalidateQueries({ queryKey: ["account-roles", "list"] })
                            }
                            disabled={blocked}
                            className="sm:w-auto"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                }
                table={
                    <DataTable<RoleEntity>
                        data={rows}
                        columns={columns}
                        loading={listQuery.isLoading}
                        emptyText={listQuery.isError ? "Failed to load." : "No roles yet."}
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
                        refresh={{
                            onClick: () => listQuery.refetch(),
                            disabled: listQuery.isLoading,
                            title: "Refresh roles",
                        }}
                    />
                }
            />

            <ConfirmDeleteDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(v) => !v && setDeleteTarget(null)}
                loading={deleteMutation.isPending}
                title="Delete this role?"
                description="This action can’t be undone."
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    await deleteMutation.mutateAsync(deleteTarget.id);
                }}
            />
        </>
    );
}
