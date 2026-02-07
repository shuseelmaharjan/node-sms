// modules/academics/components/batch-form-modal.tsx
"use client";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api";
import { handleFormError } from "@/lib/handleFormError";
import { convertBsToAd, convertAdToBs } from "@/lib/date-utils";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { NepaliBsDatePickerField } from "@/components/nepaliDate/NepaliBsDatePickerField";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { batchSchema, type BatchValues } from "../schema/batch.schema";
import type { BatchEntity } from "../columns/batch.columns";
import { SwitchField } from "@/components/fields/SwitchField";

const LIST_URL = "/api/v1/batches/";
const DETAIL_URL = (id: number) => `/api/v1/batches/${id}/`;

// Date validation utilities
const getCurrentDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
    ).padStart(2, "0")}`;
};

const isDateInFuture = (dateAd: string) => {
    if (!dateAd) return false;
    const currentDate = getCurrentDate();
    return dateAd > currentDate;
};

const isDateToday = (dateAd: string) => {
    if (!dateAd) return false;
    const currentDate = getCurrentDate();
    return dateAd === currentDate;
};

const isCurrentDateBetween = (startDateAd: string, endDateAd: string) => {
    if (!startDateAd || !endDateAd) return false;
    const currentDate = getCurrentDate();
    return currentDate >= startDateAd && currentDate <= endDateAd;
};

const hasDateExpired = (dateAd: string) => {
    if (!dateAd) return false;
    const currentDate = getCurrentDate();
    return dateAd < currentDate;
};

const createDefaults: BatchValues = {
    name: "",
    start_date_bs: "",
    start_date_ad: "",
    end_date_bs: "",
    end_date_ad: "",
    is_active: false,
};

function toDefaults(entity: BatchEntity): BatchValues {
    return {
        name: entity.name ?? "",
        start_date_bs: entity.start_date_bs ?? "",
        start_date_ad: entity.start_date_ad ?? "",
        end_date_bs: entity.end_date_bs ?? "",
        end_date_ad: entity.end_date_ad ?? "",
        is_active: Boolean(entity.is_active),
    };
}

function toPayload(values: BatchValues) {
    // Convert BS dates to AD for backend
    const start_date_ad = convertBsToAd(values.start_date_bs);
    const end_date_ad = convertBsToAd(values.end_date_bs);

    return {
        name: values.name,
        start_date_bs: values.start_date_bs,
        start_date_ad,
        end_date_bs: values.end_date_bs,
        end_date_ad,
        is_active: Boolean(values.is_active),
    };
}

export function BatchFormModal(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;

    // if null => create, else edit
    editId: number | null;
}) {

    const qc = useQueryClient();
    const isEdit = props.editId != null;

    const todayBs = React.useMemo(() => {
        const d = new Date();
        const ad = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")}`;

        const bs = convertAdToBs(ad);
        return bs ?? undefined;
    }, []);



    const detailQuery = useQuery({
        queryKey: ["batches", "detail", props.editId ?? null],
        enabled: props.open && isEdit && Boolean(props.editId),
        queryFn: async () => {
            const res = await api.get<BatchEntity>(DETAIL_URL(props.editId!));
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: BatchValues) => {
            const res = await api.post(LIST_URL, toPayload(values));
            return res.data as BatchEntity;
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["batches", "list"] });
            props.onOpenChange(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (values: BatchValues) => {
            const res = await api.put(DETAIL_URL(props.editId!), toPayload(values));
            return res.data as BatchEntity;
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["batches", "list"] });
            await qc.invalidateQueries({ queryKey: ["batches", "detail", props.editId] });
            props.onOpenChange(false);
        },
    });

    const blocked = detailQuery.isFetching || createMutation.isPending || updateMutation.isPending;

    const entity = detailQuery.data ?? null;

    // Date validation logic for edit mode
    const dateValidation = React.useMemo(() => {
        if (!isEdit || !entity) {
            return {
                canEdit: true,
                canEditStartDate: true,
                canEditEndDate: true,
                canToggleActive: true,
                canActivate: true,
                isCurrentlyActive: false,
                hasExpired: false
            };
        }

        const isCurrentlyActive = isCurrentDateBetween(entity.start_date_ad, entity.end_date_ad);
        const hasExpired = hasDateExpired(entity.end_date_ad);
        const startInFuture = isDateInFuture(entity.start_date_ad);
        const endInFuture = isDateInFuture(entity.end_date_ad);

        return {
            canEdit: startInFuture || isCurrentlyActive || (hasExpired && entity.is_active),
            canEditStartDate: startInFuture,
            canEditEndDate: !hasExpired && !isDateToday(entity.end_date_ad),
            canToggleActive: true,
            canActivate: !hasExpired, // Can't reactivate if expired
            isCurrentlyActive,
            hasExpired
        };
    }, [isEdit, entity]);

    const defaultValues = React.useMemo<BatchValues>(() => {
        if (isEdit && entity) return toDefaults(entity);
        return createDefaults;
    }, [isEdit, entity]);

    // - open changes
    // - mode changes
    // - entity loads
    const resetKey = React.useMemo(() => {
        if (!props.open) return "closed";
        if (!isEdit) return "create-open";
        return entity ? `edit-${props.editId}-ready` : `edit-${props.editId}-loading`;
    }, [props.open, isEdit, entity, props.editId]);

    const title = isEdit ? (dateValidation.canEdit ? "Update Batch" : "View Batch (Read-only)") : "Add Batch";

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent
                className="sm:max-w-[720px] overflow-visible"
                onInteractOutside={(e) => {
                    const t = e.target as HTMLElement;
                    if (t.closest(".ndp-container")) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                    const t = e.target as HTMLElement;
                    if (t.closest(".ndp-container")) e.preventDefault();
                }}
            >

                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <FormWizard
                        schema={batchSchema}
                        defaultValues={defaultValues}
                        resetKey={resetKey}
                        blocked={blocked || (isEdit && !dateValidation.canEdit)}
                        submitLoading={createMutation.isPending || updateMutation.isPending}
                        submitLabel={isEdit ? (dateValidation.canEdit ? "Update" : "Read-only") : "Create"}
                        disableSubmitUntilDirty={isEdit} // create can submit immediately; edit requires changes
                        onSubmit={async (values, methods) => {
                            try {
                                // Additional validation for edit mode
                                if (isEdit && !dateValidation.canEdit) {
                                    throw new Error("Cannot modify this batch due to date restrictions");
                                }

                                if (isEdit) await updateMutation.mutateAsync(values);
                                else await createMutation.mutateAsync(values);
                            } catch (error) {
                                handleFormError(error, { setError: methods.setError });
                            }
                        }}
                        render={(methods) => {
                            const startBs = methods.watch("start_date_bs");
                            const endBs = methods.watch("end_date_bs");
                            const startAd = methods.watch("start_date_ad");
                            const endAd = methods.watch("end_date_ad");

                            // Auto-convert BS to AD dates for internal state management
                            React.useEffect(() => {
                                if (startBs) {
                                    const ad = convertBsToAd(startBs);
                                    if (ad && startAd !== ad) {
                                        methods.setValue("start_date_ad", ad, { shouldDirty: true, shouldValidate: false });
                                    }
                                }
                                // eslint-disable-next-line react-hooks/exhaustive-deps
                            }, [startBs]);

                            React.useEffect(() => {
                                if (endBs) {
                                    const ad = convertBsToAd(endBs);
                                    if (ad && endAd !== ad) {
                                        methods.setValue("end_date_ad", ad, { shouldDirty: true, shouldValidate: false });
                                    }
                                }
                                // eslint-disable-next-line react-hooks/exhaustive-deps
                            }, [endBs]);

                            return (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                        <InputField
                                            label="Batch Name"
                                            required
                                            placeholder="e.g. 2082"
                                            disabled={blocked}
                                            {...methods.register("name")}
                                            error={methods.formState.errors.name as any}
                                        />

                                        <SwitchField
                                            label="Active"
                                            description={dateValidation.hasExpired && !entity?.is_active
                                                ? "Cannot reactivate expired batch"
                                                : "Mark this batch as the currently active academic batch."
                                            }
                                            checked={methods.watch("is_active")}
                                            disabled={blocked || (isEdit && dateValidation.hasExpired && !entity?.is_active)}
                                            error={methods.formState.errors.is_active as any}
                                            onCheckedChange={(v) => {
                                                // Prevent reactivation of expired batch
                                                if (isEdit && dateValidation.hasExpired && v && !entity?.is_active) {
                                                    return;
                                                }
                                                methods.setValue("is_active", v, {
                                                    shouldDirty: true,
                                                    shouldValidate: true,
                                                })
                                            }}
                                        />

                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <NepaliBsDatePickerField
                                            control={methods.control}
                                            name={"start_date_bs" as any}
                                            label="Start date (BS)"
                                            disabled={blocked || (isEdit && !dateValidation.canEditStartDate)}
                                            required
                                            minDateBs={isEdit && !dateValidation.canEditStartDate ? undefined : todayBs}
                                        />

                                        <NepaliBsDatePickerField
                                            control={methods.control}
                                            name={"end_date_bs" as any}
                                            label="End date (BS)"
                                            disabled={blocked || (isEdit && !dateValidation.canEditEndDate)}
                                            required
                                            minDateBs={isEdit && !dateValidation.canEditEndDate ? undefined : todayBs}
                                        />

                                    </div>
                                </div>
                            );
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
