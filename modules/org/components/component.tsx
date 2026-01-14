"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { CrudFormModal } from "@/components/crud/CrudFormModal";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import type { CrudApi, CrudCache } from "@/components/crud/types";
import { ImagePickerField } from "@/components/form/ImagePickerField";

import { FormField } from "@/components/ui/form";
import { InputField } from "@/components/form/InputField";
import { SwitchField } from "@/components/form/SwitchField";

import { schoolCreateDefaults, schoolSchema, type School } from "../schema/schema";
import { LoadingState } from "@/components/ui/LoadingState";

const LIST_KEY = ["org", "schools"];
const DETAIL_PREFIX = ["org", "schools", "detail"];

const cache: CrudCache = {
  listKey: LIST_KEY,
  detailKeyPrefix: DETAIL_PREFIX,
};

const schoolApi: CrudApi<typeof schoolSchema, School> = {
  getById: async (id: string) => {
    const res = await api.get<School>(`/api/v1/org/schools/${id}/`);
    return res.data;
  },
  create: async (values: z.infer<typeof schoolSchema>) => {
    const res = await api.post<School>(`/api/v1/org/schools/`, values);
    return res.data;
  },
  update: async (id: string, values: z.infer<typeof schoolSchema>) => {
    const res = await api.put<School>(`/api/v1/org/schools/${id}/`, values);
    return res.data;
  },
  remove: async (id: string) => {
    await api.delete(`/api/v1/org/schools/${id}/`);
  },
  toDefaults: (entity: School) => ({
    code: entity.code ?? "",
    name: entity.name ?? "",
    address: entity.address ?? "",
    phone: entity.phone ?? "",
    email: entity.email ?? "",
    is_active: Boolean(entity.is_active),
    logo_file_id: entity.logo_file?.id ?? "",
  }),
};

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-muted-foreground/20 bg-muted/40 text-muted-foreground",
      ].join(" ")}
    >
      <span
        className={[
          "mr-1.5 inline-block h-2 w-2 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground/50",
        ].join(" ")}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function SchoolSettings() {
  const queryClient = useQueryClient();

  const schoolsQuery = useQuery({
    queryKey: LIST_KEY,
    queryFn: async () => {
      const res = await api.get<School[]>(`/api/v1/org/schools/`);
      return res.data;
    },
  });

  const school = schoolsQuery.data?.[0] ?? null;

  const [modalOpen, setModalOpen] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await schoolApi.remove(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LIST_KEY });
      setDeleteOpen(false);
    },
  });

  const logoPreview = useMemo(() => school?.logo_file?.file_url ?? null, [school]);

  if (schoolsQuery.isLoading) {
    return (
      <LoadingState title="Checking authentication…" subtitle="Please wait" variant="page" />
    );
  }

  if (schoolsQuery.isError) {
    return (
      <LoadingState title="Failed to load school data" subtitle="Please try again later" variant="page" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold sm:text-xl">School</h1>
          <p className="text-sm text-muted-foreground">
            Only one school record is allowed. To create a new one, delete the existing record first.
          </p>
        </div>

        {!school ? (
          <Button onClick={() => setModalOpen(true)} className="sm:w-auto w-full">
            <Plus size={16} className="mr-2" />
            Add School
          </Button>
        ) : null}
      </div>

      {/* Body */}
      {!school ? (
        <div className="rounded-2xl border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">No school record</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create one to show school information across your dashboard.
              </p>
            </div>

            {/* <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
              <Plus size={16} className="mr-2" />
              Add School
            </Button> */}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: school info */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {/* Logo */}
              <div className="shrink-0">
                {school.logo_file?.file_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={school.logo_file.file_url}
                    alt="School logo"
                    className="h-16 w-16 rounded-xl border object-cover sm:h-20 sm:w-20"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl border bg-muted sm:h-20 sm:w-20" />
                )}
              </div>

              {/* Text */}
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold sm:text-lg">
                    {school.name}
                  </p>
                  <span className="text-sm text-muted-foreground">
                    ({school.code})
                  </span>
                  <StatusPill active={school.is_active} />
                </div>

                <div className="grid gap-1 text-sm text-muted-foreground">
                  <p className="truncate">{school.address || "—"}</p>
                  <p className="truncate">
                    {school.email || "—"}{" "}
                    <span className="mx-1">•</span>{" "}
                    {school.phone || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
              <Button
                variant="outline"
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto"
              >
                <Pencil size={16} className="mr-2" />
                Edit
              </Button>

              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
                className="w-full sm:w-auto"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Optional: detail rows (nice on desktop) */}
          <div className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="mt-1 text-sm font-medium whitespace-normal break-words [overflow-wrap:anywhere]">
                {school.email || "—"}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="mt-1 text-sm font-medium whitespace-normal break-words [overflow-wrap:anywhere]">
                {school.phone || "—"}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 sm:col-span-2 lg:col-span-1">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="mt-1 text-sm font-medium whitespace-normal break-words [overflow-wrap:anywhere]">
                {school.address || "—"}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Modal */}
      <CrudFormModal
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v);
          if (!v) setUploadingLogo(false);
        }}
        titleCreate="Add School"
        titleEdit="Edit School"
        schema={schoolSchema}
        renderSections={(methods: any) => {
          return (
            <div className="space-y-4">
              <div className="grid gap-2 md:gap-4 sm:grid-cols-2">
                <FormField
                  control={methods.control}
                  name="code"
                  render={({ field, fieldState }) => (
                    <InputField
                      label="Code"
                      required
                      placeholder="SCH-001"
                      error={fieldState.error}
                      {...field}
                      value={field.value ?? ""}
                    />
                  )}
                />

                <FormField
                  control={methods.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <InputField
                      label="Name"
                      required
                      placeholder="My School"
                      error={fieldState.error}
                      {...field}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={methods.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <InputField
                      label="Email"
                      required
                      placeholder="school@example.com"
                      error={fieldState.error}
                      {...field}
                      value={field.value ?? ""}
                    />
                  )}
                />

                <FormField
                  control={methods.control}
                  name="phone"
                  render={({ field, fieldState }) => (
                    <InputField
                      label="Phone"
                      required
                      placeholder="+977..."
                      error={fieldState.error}
                      {...field}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </div>

              <FormField
                control={methods.control}
                name="address"
                render={({ field, fieldState }) => (
                  <InputField
                    label="Address"
                    required
                    placeholder="Kathmandu, Nepal"
                    error={fieldState.error}
                    {...field}
                    value={field.value ?? ""}
                  />
                )}
              />

              <div className="hidden">
                <FormField
                control={methods.control}
                name="is_active"
                render={({ field, fieldState }) => (
                  <SwitchField
                    label="Active"
                    description="Disable to mark this school inactive."
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    error={fieldState.error}
                  />
                )}
              />
              </div>

              <FormField
                control={methods.control}
                name="logo_file_id"
                render={({ field, fieldState }) => (
                  <ImagePickerField
                    title="Logo"
                    hint="Upload school logo"
                    required
                    initialUri={logoPreview}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onUploadStatusChange={setUploadingLogo}
                    fileType="image"
                    error={fieldState.error}
                  />
                )}
              />
            </div>
          );
        }}
        id={school?.id}
        createDefaults={schoolCreateDefaults}
        api={schoolApi}
        cache={cache}
        externallyBlocked={uploadingLogo}
        canDelete={false}
        closeAfterSave
      />

      {/* Delete confirm */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete school?"
        description="This will permanently delete the school record. You can create a new school only after deleting the current one."
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!school?.id) return;
          await deleteMutation.mutateAsync(school.id);
        }}
      />
    </div>
  );
}
