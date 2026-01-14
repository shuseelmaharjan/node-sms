"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Search } from "lucide-react";

import { api } from "@/api";
import { DataTable } from "@/components/data-table/DataTable";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/form/InputField";
import { SwitchField } from "@/components/form/SwitchField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { CrudTableFormShell } from "@/components/crud/CrudTableFormShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    organizationSchoolsSchema,
    type OrganizationSchoolValues,
} from "../schema/organization-schools.schema";
import {
    organizationSchoolsColumns,
    type SchoolEntity,
} from "../columns/organization-schools.columns";

const LIST_URL = "/api/v1/org/schools/";
const DETAIL_URL = (id: string) => `/api/v1/org/schools/${id}/`;

type Mode =
    | { type: "create" }
    | { type: "edit"; id: string };

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

export function OrganizationSchoolsCrudPage() {
    const qc = useQueryClient();

    // Form is always present; default is "create"
    const [mode, setMode] = React.useState<Mode>({ type: "create" });

    const [deleteTarget, setDeleteTarget] = React.useState<SchoolEntity | null>(null);

    // Search (client-side filter)
    const [q, setQ] = React.useState("");

    // Block submit while logo uploading/removing
    const [logoBusy, setLogoBusy] = React.useState(false);

    // LIST
    const listQuery = useQuery({
        queryKey: ["org-schools", "list"],
        queryFn: async () => {
            const res = await api.get<SchoolEntity[]>(LIST_URL);
            return res.data;
        },
    });

    // DETAIL (only when editing)
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
        onSuccess: async (entity) => {
            toast.success("School created");
            await qc.invalidateQueries({ queryKey: ["org-schools", "list"] });
            setMode({ type: "edit", id: entity.id });
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.detail ?? "Failed to create");
        },
    });

    // UPDATE (PUT)
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
        onError: (e: any) => {
            toast.error(e?.response?.data?.detail ?? "Failed to update");
        },
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

            // if deleted currently edited record -> back to create
            if (mode.type === "edit" && deleteTarget?.id === mode.id) {
                setMode({ type: "create" });
            }
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.detail ?? "Failed to delete");
        },
    });

    const blocked =
        listQuery.isFetching ||
        detailQuery.isFetching ||
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending;

    const allRows = listQuery.data ?? [];

    // client-side filter
    const rows = React.useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return allRows;
        return allRows.filter((r) => {
            return (
                r.code?.toLowerCase().includes(s) ||
                r.name?.toLowerCase().includes(s) ||
                r.email?.toLowerCase().includes(s) ||
                r.phone?.toLowerCase().includes(s)
            );
        });
    }, [allRows, q]);

    const selectedEntity = mode.type === "edit" ? detailQuery.data ?? null : null;

    const defaultValues: OrganizationSchoolValues = React.useMemo(() => {
        if (mode.type === "edit" && selectedEntity) return toDefaults(selectedEntity);
        return createDefaults;
    }, [mode.type, selectedEntity]);

    // resetKey triggers FormWizard reset when switching records/create/edit
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

    const formTitle =
        mode.type === "create"
            ? "School Setup"
            : selectedEntity
                ? `School Setup — ${selectedEntity.name}`
                : "School Setup";

    return (
        <>
            <CrudTableFormShell
                title="Schools"
                formTitle={formTitle}
                formDescription="Create or update schools. Upload a logo if needed."
                form={
                    <FormWizard
                        schema={organizationSchoolsSchema}
                        defaultValues={defaultValues}
                        resetKey={resetKey}
                        blocked={blocked}
                        externallyBlocked={logoBusy}
                        submitLoading={createMutation.isPending || updateMutation.isPending}
                        submitLabel={mode.type === "create" ? "Create" : "Update"}
                        disableSubmitUntilDirty={true}
                        onSubmit={async (values, methods) => {
                            if (mode.type === "create") {
                                await createMutation.mutateAsync(values);
                                // optional: after create, form becomes edit (already done in onSuccess)
                                return;
                            }

                            if (mode.type === "edit") {
                                await updateMutation.mutateAsync({ id: mode.id, values });
                                return;
                            }

                            // safety: shouldn't happen
                            methods.reset(createDefaults, { keepDefaultValues: true });
                        }}
                        render={(methods) => (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
  {/* Left: Logo */}
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
          onUploadStatusChange={setLogoBusy}
        />
      )}
    />
  </div>

  {/* Right side: 8 columns */}
  <div className="lg:col-span-8 space-y-6">
    {/* Row 1: Organization Name (full width) */}
    <InputField
      label="Organization Name"
      required
      {...methods.register("name")}
      error={methods.formState.errors.name}
    />

    {/* Row 2: Email + Code */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <InputField
        label="Email"
        type="email"
        required
        {...methods.register("email")}
        error={methods.formState.errors.email}
      />

      <InputField
        label="Code"
        required
        {...methods.register("code")}
        error={methods.formState.errors.code}
      />
    </div>

    {/* Row 3: Address + Phone */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <InputField
        label="Address"
        required
        {...methods.register("address")}
        error={methods.formState.errors.address}
      />

      <InputField
        label="Phone"
        required
        {...methods.register("phone")}
        error={methods.formState.errors.phone}
      />
    </div>

    {/* Hidden: is_active (always true unless backend changes it) */}
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
