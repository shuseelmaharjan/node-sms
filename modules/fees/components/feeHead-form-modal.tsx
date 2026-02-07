// modules/fees/components/feeHead-form-modal.tsx
"use client";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api";
import { handleFormError } from "@/lib/handleFormError";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { SwitchField } from "@/components/fields/SwitchField";
import { SelectField } from "@/components/fields/SelectField";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { feeHeadSchema, type FeeHeadValues } from "../schema/feeHead.schema";
import type { FeeHeadEntity } from "../columns/feeHead.columns";

const LIST_URL = "/api/v1/fees/fee-heads/";
const DETAIL_URL = (id: string) => `/api/v1/fees/fee-heads/${id}/`;

const GROUP_OPTIONS = [
    { value: "ONE_TIME", label: "One-time" },
    { value: "TUITION", label: "Tuition" },
    { value: "EXAM", label: "Exam" },
    { value: "TRANSPORT", label: "Transport" },
    { value: "HOSTEL", label: "Hostel" },
    { value: "MATERIAL", label: "Materials" },
    { value: "UNIFORM", label: "Uniform" },
    { value: "DOCUMENT", label: "Documents" },
    { value: "CERTIFICATE", label: "Certificate" },
    { value: "PENALTY", label: "Penalty" },
    { value: "SPORTS", label: "Sports" },
    { value: "ECA", label: "ECA" },
    { value: "OTHER", label: "Other" },
] as const;

const createDefaults: FeeHeadValues = {
    name: "",
    code: "",
    group: "ONE_TIME",
    description: "",
    is_active: true,
};

function toDefaults(entity: FeeHeadEntity): FeeHeadValues {
    return {
        name: entity.name ?? "",
        code: entity.code ?? "",
        group: (entity.group ?? "ONE_TIME") as any,
        description: (entity.description ?? "") as any,
        is_active: Boolean(entity.is_active),
    };
}

function toPayload(values: FeeHeadValues) {
    return {
        name: values.name,
        code: values.code,
        group: values.group,
        description: values.description || "",
        is_active: Boolean(values.is_active),
    };
}

export function FeeHeadFormModal(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editId: string | null; // null => create
}) {
    const qc = useQueryClient();
    const isEdit = props.editId != null;

    const detailQuery = useQuery({
        queryKey: ["fee-heads", "detail", props.editId ?? null],
        enabled: props.open && isEdit && Boolean(props.editId),
        queryFn: async () => {
            const res = await api.get<FeeHeadEntity>(DETAIL_URL(props.editId!));
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: FeeHeadValues) => {
            const res = await api.post(LIST_URL, toPayload(values));
            return res.data as FeeHeadEntity;
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["fee-heads", "list"] });
            props.onOpenChange(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (values: FeeHeadValues) => {
            const res = await api.put(DETAIL_URL(props.editId!), toPayload(values));
            return res.data as FeeHeadEntity;
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["fee-heads", "list"] });
            await qc.invalidateQueries({ queryKey: ["fee-heads", "detail", props.editId] });
            props.onOpenChange(false);
        },
    });

    const blocked = detailQuery.isFetching || createMutation.isPending || updateMutation.isPending;
    const entity = detailQuery.data ?? null;

    const defaultValues = React.useMemo<FeeHeadValues>(() => {
        if (isEdit && entity) return toDefaults(entity);
        return createDefaults;
    }, [isEdit, entity]);

    const resetKey = React.useMemo(() => {
        if (!props.open) return "closed";
        if (!isEdit) return "create-open";
        return entity ? `edit-${props.editId}-ready` : `edit-${props.editId}-loading`;
    }, [props.open, isEdit, entity, props.editId]);

    const title = isEdit ? "Update Fee Head" : "Add Fee Head";

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="sm:max-w-[720px] overflow-visible">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <FormWizard
                    schema={feeHeadSchema}
                    defaultValues={defaultValues}
                    resetKey={resetKey}
                    blocked={blocked}
                    submitLoading={createMutation.isPending || updateMutation.isPending}
                    submitLabel={isEdit ? "Update" : "Create"}
                    disableSubmitUntilDirty={isEdit}
                    onSubmit={async (values, methods) => {
                        try {
                            if (isEdit) await updateMutation.mutateAsync(values);
                            else await createMutation.mutateAsync(values);
                        } catch (error) {
                            handleFormError(error, { setError: methods.setError });
                        }
                    }}
                    render={(methods) => (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                <InputField
                                    label="Name"
                                    required
                                    placeholder="e.g. Admission Fee"
                                    disabled={blocked}
                                    {...methods.register("name")}
                                    error={methods.formState.errors.name as any}
                                />
                                <InputField
                                    label="Description"
                                    placeholder="Optional note"
                                    disabled={blocked}
                                    {...methods.register("description")}
                                    error={methods.formState.errors.description as any}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <InputField
                                    label="Code"
                                    required
                                    placeholder="e.g. ADM"
                                    disabled={blocked}
                                    {...methods.register("code")}
                                    error={methods.formState.errors.code as any}
                                />
                                <SelectField<FeeHeadValues>
                                    control={methods.control}
                                    name={"group"}
                                    label="Group"
                                    required
                                    placeholder="Select group"
                                    options={GROUP_OPTIONS as any}
                                    disabled={blocked}
                                />


                            </div>
                            <SwitchField
                                label="Active"
                                description="Enable/disable this fee head."
                                checked={methods.watch("is_active")}
                                disabled={blocked}
                                error={methods.formState.errors.is_active as any}
                                onCheckedChange={(v) =>
                                    methods.setValue("is_active", v, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    })
                                }
                            />

                        </div>
                    )}
                />
            </DialogContent>
        </Dialog>
    );
}
