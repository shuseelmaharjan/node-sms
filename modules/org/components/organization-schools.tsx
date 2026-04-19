"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";

import { api } from "@/api";
import { DataTable } from "@/components/data-table/DataTable";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
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

import {
  organizationSchoolsSchema,
  type OrganizationSchoolValues,
} from "../schema/organization-schools.schema";
import {
  organizationSchoolsColumns,
  type SchoolEntity,
} from "../columns/organization-schools.columns";

import type { PaginatedResponse } from "@/types/api";

const LIST_URL = "/api/v1/org/schools/";
const DETAIL_URL = (id: string) => `/api/v1/org/schools/${id}/`;

type Mode = { type: "create" } | { type: "edit"; id: string };

const createDefaults: OrganizationSchoolValues = {
  code: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  logo_file_id: null,
  is_active: true,
};

function toDefaults(entity: SchoolEntity): OrganizationSchoolValues {
  return {
    code: entity.code ?? "",
    name: entity.name ?? "",
    address: entity.address ?? "",
    phone: entity.phone ?? "",
    email: entity.email ?? "",
    logo_file_id: entity.logo_file?.id ?? null,
    is_active: Boolean(entity.is_active),
  };
}

function toOrdering(s: SortingState) {
  if (!s?.length) return "";
  return s.map((x) => (x.desc ? `-${x.id}` : x.id)).join(",");
}

export function OrganizationSchoolsCrudPage() {
  const qc = useQueryClient();

  const [mode, setMode] = React.useState<Mode>({ type: "create" });
  const [deleteTarget, setDeleteTarget] = React.useState<SchoolEntity | null>(null);

  // search + pagination + sorting
  const [q, setQ] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  // ensures API meta.page_size only sets default once
  const [pageSizeInitialized, setPageSizeInitialized] = React.useState(false);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  // filters
  const [filters, setFilters] = React.useState<Record<string, string>>({
    status: "all",
  });

  const ordering = React.useMemo(() => toOrdering(sorting), [sorting]);

  // LIST QUERY FIRST (so effects can use it safely)
  const listQuery = useQuery<PaginatedResponse<SchoolEntity>>({
    queryKey: ["org-schools", "list", { pageIndex, pageSize, q, ordering, filters }],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<SchoolEntity>>(LIST_URL, {
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
    queryKey: ["org-schools", "detail", mode.type === "edit" ? mode.id : null],
    enabled: mode.type === "edit",
    queryFn: async () => {
      const id = mode.type === "edit" ? mode.id : "";
      const res = await api.get<SchoolEntity>(DETAIL_URL(id));
      return res.data;
    },
  });

  // CREATE
  const createMutation = useMutation({
    mutationFn: async (values: OrganizationSchoolValues) => {
      const payload = {
        code: values.code,
        name: values.name,
        address: values.address || "",
        phone: values.phone || "",
        email: values.email || "",
        logo_file_id: values.logo_file_id ?? null,
        is_active: values.is_active,
      };
      const res = await api.post<SchoolEntity>(LIST_URL, payload);
      return res.data;
    },
    onSuccess: async () => {
      toast.success("School created");
      await qc.invalidateQueries({ queryKey: ["org-schools", "list"] });

      // stay in create mode
      setMode({ type: "create" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to create"),
  });

  // UPDATE
  const updateMutation = useMutation({
    mutationFn: async (args: { id: string; values: OrganizationSchoolValues }) => {
      const payload = {
        code: args.values.code,
        name: args.values.name,
        address: args.values.address || "",
        phone: args.values.phone || "",
        email: args.values.email || "",
        logo_file_id: args.values.logo_file_id ?? null,
        is_active: args.values.is_active,
      };
      const res = await api.put<SchoolEntity>(DETAIL_URL(args.id), payload);
      return res.data;
    },
    onSuccess: async (entity) => {
      toast.success("School updated");
      await qc.invalidateQueries({ queryKey: ["org-schools", "list"] });
      qc.setQueryData(["org-schools", "detail", entity.id], entity);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to update"),
  });

  // DELETE
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(DETAIL_URL(id));
    },
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["org-schools", "list"] });
      setDeleteTarget(null);
      if (mode.type === "edit" && deleteTarget?.id === mode.id) {
        setMode({ type: "create" });
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to delete"),
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

  const defaultValues: OrganizationSchoolValues = React.useMemo(() => {
    if (mode.type === "edit" && selectedEntity) return toDefaults(selectedEntity);
    return createDefaults;
  }, [mode.type, selectedEntity]);

  const resetKey = React.useMemo(() => {
    if (mode.type === "create") return "create";
    return selectedEntity ? `edit-${mode.id}-ready` : `edit-${mode.id}-loading`;
  }, [mode, selectedEntity]);

  const columns = React.useMemo(
    () =>
      organizationSchoolsColumns({
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
        title="Schools"
        formTitle={
          mode.type === "create"
            ? "School Setup"
            : selectedEntity
              ? `School Setup — ${selectedEntity.name}`
              : "School Setup"
        }
        formDescription="Create or update schools. Upload a logo if needed."
        form={
          <FormWizard
            schema={organizationSchoolsSchema}
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
                qc.removeQueries({ queryKey: ["org-schools", "detail"] });

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
                qc.removeQueries({ queryKey: ["org-schools", "detail"] });

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
                <div className="lg:col-span-4">
                  <Controller
                    control={methods.control}
                    name="logo_file_id"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="Logo"
                        hint="Click to upload school logo"
                        value={field.value ?? null}
                        onChange={field.onChange}
                        initialUri={selectedEntity?.logo_file?.file_url ?? null}
                        error={fieldState.error}
                        required={true}
                        fileType="image"
                        onUploadStatusChange={() => { }}
                      />
                    )}
                  />
                </div>

                <div className="lg:col-span-8 space-y-6">
                  <InputField
                    label="Organization Name"
                    placeholder="Organization Name"
                    required
                    {...methods.register("name")}
                    error={methods.formState.errors.name}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Email"
                      type="email"
                      placeholder="Email"
                      required
                      {...methods.register("email")}
                      error={methods.formState.errors.email}
                    />
                    <InputField
                      label="Code"
                      required
                      placeholder="SCH001"
                      {...methods.register("code")}
                      error={methods.formState.errors.code}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Address"
                      required
                      placeholder="Kathmandu, Nepal"
                      {...methods.register("address")}
                      error={methods.formState.errors.address}
                    />
                    <InputField
                      label="Phone"
                      required
                      placeholder="98********"
                      {...methods.register("phone")}
                      error={methods.formState.errors.phone}
                    />
                  </div>

                  <Controller
                    control={methods.control}
                    name="is_active"
                    render={({ field }) => (
                      <input type="hidden" value={field.value ? "true" : "false"} />
                    )}
                  />
                </div>
              </div>
            )}
          />
        }
        tableTitle="Schools List"
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
                    const choices = cfg?.choices ?? [];
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
                          <DropdownMenuRadioItem value="all">all</DropdownMenuRadioItem>
                          {choices
                            .filter((c) => c !== "all")
                            .map((c) => (
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
              onClick={() => qc.invalidateQueries({ queryKey: ["org-schools", "list"] })}
              disabled={blocked}
              className="sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
        table={
          <DataTable<SchoolEntity>
            data={rows}
            columns={columns}
            loading={listQuery.isLoading}
            emptyText={listQuery.isError ? "Failed to load." : "No schools yet."}
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
              onClick: () =>
                qc.invalidateQueries({ queryKey: ["org-schools", "list"] }),
              disabled: blocked,
              icon: <RefreshCw className="h-4 w-4" />,
              title: "Refresh schools",
            }}
          />
        }
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        title="Delete this school?"
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
