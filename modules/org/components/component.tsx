"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { z } from "zod";

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
        logo_file: entity.logo_file?.id ?? null,
    }),
};

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

    if (schoolsQuery.isLoading) return <div className="p-6">Loading...</div>;
    if (schoolsQuery.isError) return <div className="p-6">Failed to load school settings.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">School Settings</h1>
                    <p className="text-sm text-muted-foreground">
                        Only one school record is allowed. To create a new one, delete the existing record first.
                    </p>
                </div>

                {!school ? <Button onClick={() => setModalOpen(true)}>Add School</Button> : null}
            </div>

            {!school ? (
                <div className="rounded-xl border bg-white p-6">
                    <p className="text-sm text-muted-foreground">No school record found.</p>
                    <div className="mt-4">
                        <Button onClick={() => setModalOpen(true)}>Add School</Button>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border bg-white p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                            {school.logo_file?.file ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={school.logo_file.file}
                                    alt="School logo"
                                    className="h-16 w-16 rounded-lg border object-cover"
                                />
                            ) : (
                                <div className="h-16 w-16 rounded-lg border bg-muted" />
                            )}

                            <div>
                                <p className="text-base font-semibold">
                                    {school.name}{" "}
                                    <span className="text-sm text-muted-foreground">({school.code})</span>
                                </p>
                                <p className="text-sm text-muted-foreground">{school.address || "—"}</p>
                                <p className="text-sm text-muted-foreground">
                                    {school.email || "—"} • {school.phone || "—"}
                                </p>
                                <p className="mt-1 text-xs">
                                    Status:{" "}
                                    <span className={school.is_active ? "text-emerald-600" : "text-muted-foreground"}>
                                        {school.is_active ? "Active" : "Inactive"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setModalOpen(true)}>
                                Edit
                            </Button>
                            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
                    const logoPreview = school?.logo_file?.file ?? null;

                    return (
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
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
                                        placeholder="Kathmandu, Nepal"
                                        error={fieldState.error}
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                )}
                            />

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

                            <Controller
                                control={methods.control}
                                name="logo_file"
                                render={({ field, fieldState }) => (
                                    <ImagePickerField
                                        title="Logo"
                                        hint="Upload school logo"
                                        initialUri={logoPreview}
                                        value={field.value ?? null}
                                        onChange={field.onChange}
                                        onUploadStatusChange={setUploadingLogo}
                                        fileType="image"
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
