// confirm-enrollment-form.tsx
"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { api } from "@/api";
import { Badge } from "@/components/ui/badge";
import { FormWizard } from "@/components/form/FormWizard";
import { SelectField } from "@/components/fields/SelectField";
import { InputField } from "@/components/fields/InputField";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  confirmEnrollmentSchema,
  type ConfirmEnrollmentValues,
} from "../schema/confirm-enrollment.schema";
import type {
  ApplicableFeeResponse,
  ApplicableFeeStructure,
  BatchRow,
  ClassroomRow,
  PaginatedResponse,
  SectionRow,
} from "../types/confirm-enrollment.types";
import { formatDateShort } from "@/utils/text-utils";
import { FeeItemsList, safeMoney, toNum, multiplierForPeriod } from "./fee-items-list";

/* endpoints */
const BATCHES_URL = `/api/v1/batches/`;
const CLASSES_URL = `/api/v1/academics/classrooms/`;
const SECTIONS_URL = `/api/v1/academics/sections/`;
const APPLICABLE_FEES_URL = (batchId: string, classId: string) =>
  `/api/v1/fees/fee-structures/applicable/?batch_id=${batchId}&class_id=${classId}/`;
const SUBMIT_URL = `/api/v1/academics/student-enrollments/enroll-and-setup-fees/`;

/* ✅ NEW: tax math helper (same rule used everywhere) */
function splitTax(lineAmount: number, taxIncluded: boolean, taxRate: number) {
  if (taxRate <= 0) return { net: lineAmount, tax: 0, payable: lineAmount };

  if (taxIncluded) {
    const net = lineAmount / (1 + taxRate);
    const tax = lineAmount - net;
    return { net, tax, payable: lineAmount };
  }

  const net = lineAmount;
  const tax = net * taxRate;
  return { net, tax, payable: net + tax };
}

/* money input helpers */
function sanitizeMoneyInput(raw: string) {
  let v = raw.replace(/[^\d.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  const [i, d] = v.split(".");
  if (d != null) v = `${i}.${d.slice(0, 2)}`;
  return v;
}

function MoneyField(props: {
  label: string;
  name: "total_payable_amount" | "discounted_amount" | "scholarship_amount";
  required?: boolean;
  hint?: string;
  methods: any;
  onUserChange?: () => void;
}) {
  const {
    register,
    setValue,
    formState: { errors },
  } = props.methods;

  return (
    <InputField
      label={props.label}
      required={props.required}
      hint={props.hint}
      inputMode="decimal"
      placeholder="0.00"
      {...register(props.name)}
      onChange={(e) => {
        props.onUserChange?.();
        const cleaned = sanitizeMoneyInput(e.target.value);
        setValue(props.name, cleaned, { shouldDirty: true, shouldValidate: true });
      }}
      onBlur={(e) => {
        if (
          (props.name === "discounted_amount" ||
            props.name === "scholarship_amount") &&
          !e.target.value.trim()
        ) {
          setValue(props.name, "0.00", { shouldDirty: true, shouldValidate: true });
        }
      }}
      error={(errors as any)?.[props.name]}
    />
  );
}

export function ConfirmEnrollmentForm(props: {
  studentId: string;
  currencySymbol: string;
  taxRate: number; // 0.13
}) {
  const router = useRouter();

  const { studentId, currencySymbol, taxRate } = props;

  const [batchId, setBatchId] = React.useState<string>("");
  const [classId, setClassId] = React.useState<string>("");

  const batchesQuery = useQuery<PaginatedResponse<BatchRow>>({
    queryKey: ["student-enrollment", "batches", "active"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<BatchRow>>(BATCHES_URL, {
        params: { status: "active", page: 1, page_size: 200 },
      });
      return res.data;
    },
  });

  const classesQuery = useQuery<PaginatedResponse<ClassroomRow>>({
    queryKey: ["student-enrollment", "classes", batchId],
    enabled: !!batchId,
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<ClassroomRow>>(CLASSES_URL, {
        params: { batch: batchId, page: 1, page_size: 200 },
      });
      return res.data;
    },
  });

  const sectionsQuery = useQuery<PaginatedResponse<SectionRow>>({
    queryKey: ["student-enrollment", "sections", classId],
    enabled: !!classId,
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<SectionRow>>(SECTIONS_URL, {
        params: { academic_class_id: classId, page: 1, page_size: 200 },
      });
      return res.data;
    },
  });

  const applicableFeesQuery = useQuery<ApplicableFeeResponse>({
    queryKey: ["student-enrollment", "applicable-fees", batchId, classId],
    enabled: !!batchId && !!classId,
    queryFn: async () =>
      (await api.get<ApplicableFeeResponse>(APPLICABLE_FEES_URL(batchId, classId))).data,
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: any) =>
      (await api.post(SUBMIT_URL, payload)).data,

    onSuccess: () => {
      toast.success("Enrollment completed successfully.", {
        description:
          "The student has been enrolled and the fee structure has been created.",
      });

      router.replace("/students");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail ??
        "Failed to complete student enrollment."
      );
    },
  });

  const batchOptions =
    batchesQuery.data?.results?.map((b) => ({
      value: String(b.id),
      label: `${b.name} • ${b.start_date_bs} → ${b.end_date_bs}`,
    })) ?? [];

  const classOptions =
    classesQuery.data?.results?.map((c) => ({
      value: c.id,
      label: c.name,
    })) ?? [];

  const sectionRows = sectionsQuery.data?.results ?? [];
  const hasSections = sectionRows.length > 0;
  const sectionOptions = sectionRows.map((s) => ({ value: s.id, label: s.name }));

  const batchDetail = applicableFeesQuery.data?.batch;
  const feeRows = applicableFeesQuery.data?.data ?? [];
  const currentBatchEndAd = batchDetail?.end_date_ad ?? null;

  const defaultValues: ConfirmEnrollmentValues = {
    batch: "",
    academic_class: "",
    section: "",
    fee_structures: [],
    total_payable_amount: "0.00",
    discounted_amount: "0.00",
    scholarship_amount: "0.00",
  };

  const formatCurrency = React.useCallback(
    (n: number) => `${currencySymbol} ${safeMoney(n)}`,
    [currencySymbol]
  );

  return (
    <section className="rounded-lg border p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold">Enrollment & Fees</h3>
        <p className="text-xs text-muted-foreground">
          Select batch/class/section and applicable fees.
        </p>
      </div>

      <FormWizard
        schema={confirmEnrollmentSchema}
        defaultValues={defaultValues}
        disableSubmitUntilDirty={true}
        submitLabel="Enroll & Setup Fees"
        submitLoading={submitMutation.isPending}
        blocked={batchesQuery.isLoading || submitMutation.isPending}
        onSubmit={async (values, methods) => {
          const payload = {
            student: studentId,
            batch: Number(values.batch),
            academic_class: values.academic_class,
            section: values.section || null,
            fee_structures: values.fee_structures,
            total_payable_amount: values.total_payable_amount,
            discounted_amount: values.discounted_amount ?? "0.00",
            scholarship_amount: values.scholarship_amount ?? "0.00",
          };

          await submitMutation.mutateAsync(payload);

          toast.success("Student enrolled successfully.", {
            description:
              "Enrollment has been completed and the fee structure has been configured.",
          });

          methods.reset(values, {
            keepDefaultValues: false,
          });

          router.replace("/students");
        }}
        render={(methods) => {
          const { control, watch, setValue } = methods;

          const wBatch = watch("batch");
          const wClass = watch("academic_class");
          const selectedFees = watch("fee_structures") ?? [];

          const payable = toNum(watch("total_payable_amount"));
          const discount = toNum(watch("discounted_amount"));
          const scholarship = toNum(watch("scholarship_amount"));

          const lastChanged = React.useRef<
            "payable" | "discount" | "scholarship" | "fees" | null
          >(null);

          React.useEffect(() => {
            setBatchId(wBatch || "");
            setValue("academic_class", "");
            setValue("section", "");
            setClassId("");
            setValue("fee_structures", []);
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [wBatch]);

          React.useEffect(() => {
            setClassId(wClass || "");
            setValue("section", "");
            setValue("fee_structures", []);
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [wClass]);

          /**
           * ✅ IMPORTANT FIX:
           * gross should represent TOTAL PAYABLE (what the student pays),
           * not net.
           */
          const gross = React.useMemo(() => {
            if (!feeRows.length || !selectedFees.length) return 0;

            const selected = feeRows.filter((x) => selectedFees.includes(x.id));
            let sum = 0;

            for (const f of selected) {
              const amt = Number(f.amount || 0);
              const mult = multiplierForPeriod(f.period, currentBatchEndAd);
              const lineAmount = amt * mult;

              const taxIncluded = (f as any).tax_included ?? false;
              const { payable } = splitTax(lineAmount, taxIncluded, taxRate);

              sum += payable;
            }

            return Math.max(0, sum);
          }, [feeRows, selectedFees, currentBatchEndAd, taxRate]);

          const derivedPayable = Math.max(0, gross - discount - scholarship);

          React.useEffect(() => {
            lastChanged.current = "fees";
            setValue("discounted_amount", "0.00", { shouldDirty: false, shouldValidate: true });
            setValue("scholarship_amount", "0.00", { shouldDirty: false, shouldValidate: true });
            setValue("total_payable_amount", safeMoney(gross), {
              shouldDirty: false,
              shouldValidate: true,
            });
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [gross]);

          React.useEffect(() => {
            if (lastChanged.current === "discount" || lastChanged.current === "scholarship") {
              setValue("total_payable_amount", safeMoney(derivedPayable), {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [discount, scholarship, gross]);

          React.useEffect(() => {
            if (lastChanged.current === "payable") {
              const newDiscount = Math.max(0, gross - payable - scholarship);
              setValue("discounted_amount", safeMoney(newDiscount), {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [payable, gross, scholarship]);

          return (
            <div className="space-y-5">
              <SelectField
                control={control}
                name="batch"
                label="Batch"
                required
                placeholder="Select active batch"
                options={batchOptions}
                disabled={batchesQuery.isLoading}
              />

              <SelectField
                control={control}
                name="academic_class"
                label="Class"
                required
                placeholder={batchId ? "Select class" : "Select batch first"}
                options={classOptions}
                disabled={!batchId || classesQuery.isLoading}
              />

              <SelectField
                control={control}
                name="section"
                label="Section"
                required={hasSections}
                placeholder={
                  !classId
                    ? "Select class first"
                    : hasSections
                      ? "Select section"
                      : "No sections for this class"
                }
                options={sectionOptions}
                disabled={!classId || sectionsQuery.isLoading || !hasSections}
              />

              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">
                  {batchDetail ? (
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">
                        Fee estimation until batch end
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div>
                          End (AD):{" "}
                          <span className="font-medium">
                            {formatDateShort(batchDetail.end_date_ad)}
                          </span>
                        </div>
                        <div>
                          End (BS):{" "}
                          <span className="font-medium">{batchDetail.end_date_bs}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>Select batch + class to load applicable fees.</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Applicable Fee Items</div>
                  <div className="text-xs text-muted-foreground">
                    {applicableFeesQuery.isLoading ? "Loading..." : `${feeRows.length} items`}
                  </div>
                </div>

                {applicableFeesQuery.isError ? (
                  <div className="text-sm text-destructive">Failed to load applicable fees.</div>
                ) : !batchId || !classId ? (
                  <div className="text-sm text-muted-foreground">
                    Select batch and class first.
                  </div>
                ) : feeRows.length ? (
                  <FeeItemsList
                    feeRows={feeRows as ApplicableFeeStructure[]}
                    selectedIds={selectedFees}
                    onToggle={(id, checked) => {
                      lastChanged.current = "fees";
                      const next = checked
                        ? Array.from(new Set([...selectedFees, id]))
                        : selectedFees.filter((x) => x !== id);
                      setValue("fee_structures", next, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    batchEndAd={currentBatchEndAd}
                    currencySymbol={currencySymbol}
                    taxRate={taxRate}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">No applicable fee structures.</div>
                )}

                {(methods.formState.errors as any)?.fee_structures?.message ? (
                  <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
                    {(methods.formState.errors as any)?.fee_structures?.message}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <MoneyField
                  label="Total payable amount"
                  name="total_payable_amount"
                  required
                  methods={methods}
                  hint="Auto-calculated. If you override, discount adjusts automatically."
                  onUserChange={() => (lastChanged.current = "payable")}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MoneyField
                    label="Discount amount"
                    name="discounted_amount"
                    methods={methods}
                    hint="Optional"
                    onUserChange={() => (lastChanged.current = "discount")}
                  />
                  <MoneyField
                    label="Scholarship amount"
                    name="scholarship_amount"
                    methods={methods}
                    hint="Optional"
                    onUserChange={() => (lastChanged.current = "scholarship")}
                  />
                </div>

                <div className="rounded-md border p-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Gross estimate</span>
                    <span className="tabular-nums">{formatCurrency(gross)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Discount</span>
                    <span className="tabular-nums">- {formatCurrency(discount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Scholarship</span>
                    <span className="tabular-nums">- {formatCurrency(scholarship)}</span>
                  </div>
                  <div className="pt-2 flex justify-between text-sm font-semibold">
                    <span>Payable (calc)</span>
                    <span className="tabular-nums">{formatCurrency(derivedPayable)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      />
    </section>
  );
}
