"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { handleFormError } from "@/lib/handleFormError";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { SelectField } from "@/components/fields/SelectField";
import { SwitchField } from "@/components/fields/SwitchField";

import { feeStructureSchema, type FeeStructureValues } from "../schema/feeStructure.schema";
import type { FeeStructureEntity } from "../columns/feeStructure.columns";

const LIST_URL = "/api/v1/fees/fee-structures/";
const DETAIL_URL = (id: string) => `/api/v1/fees/fee-structures/${id}/`;

// option endpoints
const FEE_HEADS_URL = "/api/v1/fees/fee-heads/"; // or "/api/v1/fees/fee-heads/active-for-school/"
const ACTIVE_BATCHES_URL = "/api/v1/batches/?status=active";
const CLASSES_BY_BATCH_URL = (batchId: number) => `/api/v1/academics/classrooms/?batch=${batchId}`;

type SimpleOption = { value: string; label: string };
type BatchOption = { value: number; label: string };

const SCOPE_OPTIONS: SimpleOption[] = [
    { value: "GLOBAL", label: "Global" },
    // { value: "CLASS", label: "Specific" },
    { value: "BATCH_CLASS", label: "Specific" },
];

const PERIOD_OPTIONS: SimpleOption[] = [
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "SEMESTER", label: "Semester" },
    { value: "ANNUAL", label: "Annual" },
    { value: "ONE_TIME", label: "One Time" },
    { value: "OTHER", label: "Other" },
];

const createDefaults: FeeStructureValues = {
    fee_head: "",
    amount: "",
    period: "ANNUAL",
    status: "active",
    upgrade_impact: false,
    scope: "GLOBAL",
    tax_included: false,
    batch: null,
    academic_class: null,
};

function toDefaults(entity: FeeStructureEntity): FeeStructureValues {
    return {
        fee_head: entity.fee_head,
        amount: String(entity.amount ?? ""),
        period: entity.period as any,
        status: entity.status as any,
        upgrade_impact: Boolean(entity.upgrade_impact),
        scope: entity.scope as any,
        tax_included: Boolean(entity.tax_included),
        batch: entity.batch != null ? String(entity.batch) : null,
        academic_class: (entity.academic_class ?? null) as any,
    };
}

function toPayload(values: FeeStructureValues) {
    return {
        fee_head: values.fee_head,
        amount: values.amount,
        period: values.period,
        status: "active",
        upgrade_impact: Boolean(values.upgrade_impact),
        scope: values.scope,
        tax_included: Boolean(values.tax_included),

        batch: values.scope === "GLOBAL"
            ? null
            : values.batch ? Number(values.batch) : null,

        academic_class: values.scope === "GLOBAL" ? null : values.academic_class ?? null,
    };
}

export function FeeStructureFormModal(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editId: string | null;
}) {
    const qc = useQueryClient();
    const isEdit = props.editId != null;

    // detail
    const detailQuery = useQuery({
        queryKey: ["fee-structures", "detail", props.editId ?? null],
        enabled: props.open && isEdit && Boolean(props.editId),
        queryFn: async () => {
            const res = await api.get<FeeStructureEntity>(DETAIL_URL(props.editId!));
            return res.data;
        },
    });

    // fee heads (list)
    const feeHeadsQuery = useQuery({
        queryKey: ["fee-heads", "options"],
        enabled: props.open,
        queryFn: async () => {
            const res = await api.get<any>(FEE_HEADS_URL, { params: { page_size: 200 } });
            // support paginated response
            const items = res.data?.results ?? res.data ?? [];
            return items as Array<{ id: string; name: string; code: string; is_active: boolean }>;
        },
    });

    // batches (active)
    const batchesQuery = useQuery({
        queryKey: ["batches", "active-options"],
        enabled: props.open,
        queryFn: async () => {
            const res = await api.get<any>(ACTIVE_BATCHES_URL, { params: { page_size: 200 } });
            const items = res.data?.results ?? [];
            // id is int in your AcademicBatch
            return items as Array<{ id: number; name: string }>;
        },
    });

    // dependent classes query (by batch)
    const [selectedBatchId, setSelectedBatchId] = React.useState<number | null>(null);
    const [isFormInitialized, setIsFormInitialized] = React.useState(false);

    const classesQuery = useQuery({
        queryKey: ["classes", "by-batch", selectedBatchId],
        enabled: props.open && selectedBatchId != null,
        queryFn: async () => {
            const res = await api.get<any>(CLASSES_BY_BATCH_URL(selectedBatchId!));
            const items = res.data?.results ?? res.data ?? [];
            // AcademicClass id is uuid
            return items as Array<{ id: string; name: string }>;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: FeeStructureValues) => {
            const res = await api.post(LIST_URL, toPayload(values));
            return res.data as FeeStructureEntity;
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["fee-structures", "list"] });
            props.onOpenChange(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (values: FeeStructureValues) => {
            const res = await api.put(DETAIL_URL(props.editId!), toPayload(values));
            return res.data as FeeStructureEntity;
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["fee-structures", "list"] });
            await qc.invalidateQueries({ queryKey: ["fee-structures", "detail", props.editId] });
            props.onOpenChange(false);
        },
    });

    const blocked =
        !isFormInitialized ||
        detailQuery.isFetching ||
        feeHeadsQuery.isFetching ||
        batchesQuery.isFetching ||
        (selectedBatchId != null && classesQuery.isFetching) ||
        createMutation.isPending ||
        updateMutation.isPending;

    const entity = detailQuery.data ?? null;

    const defaultValues = React.useMemo<FeeStructureValues>(() => {
        if (isEdit && entity) return toDefaults(entity);
        return createDefaults;
    }, [isEdit, entity]);

    // Initialize form state properly for edit mode
    React.useEffect(() => {
        if (!props.open) {
            setIsFormInitialized(false);
            setSelectedBatchId(null);
            return;
        }

        // For create mode, initialize immediately
        if (!isEdit) {
            setSelectedBatchId(null);
            setIsFormInitialized(true);
            return;
        }

        // For edit mode, wait for entity data and proper dependencies
        if (isEdit && entity && !detailQuery.isFetching && !batchesQuery.isFetching && !feeHeadsQuery.isFetching) {
            // Set up batch selection if entity has batch
            if (entity.batch != null) {
                setSelectedBatchId(entity.batch);
            } else {
                setSelectedBatchId(null);
            }
            setIsFormInitialized(true);
        }
    }, [props.open, isEdit, entity, detailQuery.isFetching, batchesQuery.isFetching, feeHeadsQuery.isFetching]);

    // keep selectedBatchId in sync with form default when editing
    React.useEffect(() => {
        if (!props.open) return;
        if (isEdit && entity?.batch != null) setSelectedBatchId(entity.batch);
        if (!isEdit) setSelectedBatchId(null);
    }, [props.open, isEdit, entity?.batch]);

    const resetKey = React.useMemo(() => {
        if (!props.open) return "closed";
        if (!isEdit) return "create-open";
        return entity ? `edit-${props.editId}-ready` : `edit-${props.editId}-loading`;
    }, [props.open, isEdit, entity, props.editId]);

    const title = isEdit ? "Update Fee Structure" : "Add Fee Structure";

    const feeHeadOptions: SimpleOption[] =
        (feeHeadsQuery.data ?? [])
            .filter((x) => x.is_active !== false) // keep safe
            .map((x) => ({ value: x.id, label: `${x.name}` })) ?? [];

    const batchOptions: BatchOption[] =
        (batchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.name })) ?? [];

    const classOptions: SimpleOption[] =
        (classesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })) ?? [];

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="sm:max-w-[820px] overflow-visible">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <FormWizard
                    schema={feeStructureSchema}
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
                    render={(methods) => {
                        const scope = methods.watch("scope") as FeeStructureValues["scope"];
                        const batchVal = methods.watch("batch");

                        const showBatch = scope !== "GLOBAL";
                        const showClass = scope === "CLASS" || scope === "BATCH_CLASS";
                        const showErrors = methods.formState.submitCount > 0;

                        const batchError = showErrors ? (methods.formState.errors.batch as any) : undefined;
                        const classError = showErrors ? (methods.formState.errors.academic_class as any) : undefined;


                        // Scope change effect - only apply after form is initialized
                        React.useEffect(() => {
                            // Don't interfere with initial form setup
                            if (!isFormInitialized) return;
                            
                            if (scope === "GLOBAL") {
                                methods.setValue("batch", null, { shouldDirty: true, shouldValidate: false });
                                methods.setValue("academic_class", null, { shouldDirty: true, shouldValidate: false });
                                setSelectedBatchId(null);
                            }
                            // For CLASS/BATCH_CLASS scopes, don't automatically clear class in edit mode
                            // Let user keep existing values until they manually change them
                            // eslint-disable-next-line react-hooks/exhaustive-deps
                        }, [scope, isFormInitialized]);

                        // Batch change effect - only apply after form is initialized
                        React.useEffect(() => {
                            // Don't interfere with initial form setup
                            if (!isFormInitialized) return;
                            
                            if (batchVal == null) {
                                setSelectedBatchId(null);
                                methods.setValue("academic_class", null, { shouldDirty: true, shouldValidate: false });
                            } else {
                                const id = Number(batchVal);
                                const validId = Number.isNaN(id) ? null : id;
                                setSelectedBatchId(validId);
                                // Only clear class if batch actually changed
                                if (selectedBatchId !== validId) {
                                    methods.setValue("academic_class", null, { shouldDirty: true, shouldValidate: false });
                                }
                            }
                            // eslint-disable-next-line react-hooks/exhaustive-deps
                        }, [batchVal, isFormInitialized]);



                        return (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <SelectField<any>
                                        control={methods.control}
                                        name={"fee_head"}
                                        label="Fee Head"
                                        required
                                        placeholder={feeHeadsQuery.isLoading ? "Loading..." : "Select fee head"}
                                        options={feeHeadOptions as any}
                                        disabled={blocked || feeHeadsQuery.isLoading}
                                    />

                                    <InputField
                                        label="Amount"
                                        required
                                        placeholder="e.g. 2500"
                                        disabled={blocked}
                                        {...methods.register("amount")}
                                        error={methods.formState.errors.amount as any}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <SelectField<any>
                                        control={methods.control}
                                        name={"period"}
                                        label="Period"
                                        required
                                        placeholder="Select period"
                                        options={PERIOD_OPTIONS as any}
                                        disabled={blocked}
                                    />

                                    <SelectField<any>
                                        control={methods.control}
                                        name={"scope"}
                                        label="Scope"
                                        required
                                        placeholder="Select scope"
                                        options={SCOPE_OPTIONS as any}
                                        disabled={blocked}
                                    />
                                </div>

                                {showBatch && (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <SelectField<any>
                                            control={methods.control}
                                            name={"batch"}
                                            label="Batch"
                                            placeholder={batchesQuery.isLoading ? "Loading..." : "Select batch"}
                                            options={batchOptions.map((b) => ({ value: String(b.value), label: b.label }))}
                                            disabled={blocked || batchesQuery.isLoading}
                                        // error={batchError}
                                        />


                                        {showClass && (
                                            <SelectField<any>
                                                control={methods.control}
                                                name={"academic_class"}
                                                label="Class"
                                                required
                                                placeholder={
                                                    selectedBatchId == null
                                                        ? "Select batch first"
                                                        : classesQuery.isLoading
                                                            ? "Loading..."
                                                            : "Select class"
                                                }
                                                options={classOptions as any}
                                                disabled={blocked || selectedBatchId == null || classesQuery.isLoading}
                                            // error={classError}
                                            />

                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <SwitchField
                                        label="Tax Included"
                                        description="If enabled, amount includes tax."
                                        checked={methods.watch("tax_included")}
                                        disabled={blocked}
                                        error={methods.formState.errors.tax_included as any}
                                        onCheckedChange={(v) =>
                                            methods.setValue("tax_included", v, { shouldDirty: true, shouldValidate: true })
                                        }
                                    />
                                    <SwitchField
                                        label="Upgrade Impact"
                                        description="Enable if this fee changes during upgrade/promotions."
                                        checked={methods.watch("upgrade_impact")}
                                        disabled={blocked}
                                        error={methods.formState.errors.upgrade_impact as any}
                                        onCheckedChange={(v) =>
                                            methods.setValue("upgrade_impact", v, { shouldDirty: true, shouldValidate: true })
                                        }
                                    />
                                </div>
                            </div>
                        );
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
