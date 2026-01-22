"use client";

import * as React from "react";
import { Controller, useFieldArray } from "react-hook-form";

import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/form/InputField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { Button } from "@/components/ui/button"; // still used for remove? we will not remove addresses now, but keep import ok
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { clientInfoSchema, type ClientInfoValues } from "../../schema/admin.schema";
import { NepaliBsDatePickerField } from "@/lib/nepaliDate/NepaliBsDatePickerField";
import { GenderSelectField } from "@/components/select/GenderSelectField";
import { BloodGroupSelectField, MotherTongueSelectField, NationalitySelectField, ReligionSelectField } from "@/components/select";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Others" },
];

const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const NATIONALITY_OPTIONS = [
  { value: "Nepali", label: "Nepali" },
  { value: "Indian", label: "Indian" },
  { value: "Other", label: "Other" },
] as const;

const RELIGION_OPTIONS = [
  { value: "Hindu", label: "Hindu" },
  { value: "Muslim", label: "Muslim" },
  { value: "Other", label: "Other" },
] as const;

const MOTHER_TONGUE_OPTIONS = [
  { value: "Nepali", label: "Nepali" },
  { value: "Maithili", label: "Maithili" },
  { value: "Bhojpuri", label: "Bhojpuri" },
  { value: "Tharu", label: "Tharu" },
  { value: "Tamang", label: "Tamang" },
  { value: "Newari", label: "Newari" },
  { value: "Other", label: "Other" },
] as const;

const DOC_TYPES = [
  { type: "photo", title: "Photo", remarks: "Photo" },
  { type: "citizenship_front", title: "Citizenship Front", remarks: "Citizenship Front" },
  { type: "citizenship_back", title: "Citizenship Back", remarks: "Citizenship Back" },
  { type: "pan", title: "PAN Document", remarks: "PAN" },
  { type: "signature", title: "Signature", remarks: "Signature" },
] as const;

function ensureTwoAddresses(p: any) {
  const fromApi: any[] = Array.isArray(p?.addresses) ? p.addresses : [];

  const permanent = fromApi.find((a) => a.address_type === "permanent");
  const temporary = fromApi.find((a) => a.address_type === "temporary");

  const mk = (address_type: "permanent" | "temporary", src?: any) => ({
    address_type,
    country: src?.country ?? "Nepal",
    province: src?.province ?? "",
    district: src?.district ?? "",
    municipality: src?.municipality ?? "",
    ward_no: String(src?.ward_no ?? ""),
    street: src?.street ?? "",
    tole: src?.tole ?? "",
    house_no: src?.house_no ?? "",
    postal_code: src?.postal_code ?? "",
    is_primary: address_type === "permanent" ? true : Boolean(src?.is_primary),
  });

  return [mk("permanent", permanent), mk("temporary", temporary)];
}

function ensureFiveDocuments(p: any) {
  const fromApi: any[] = Array.isArray(p?.documents) ? p.documents : [];

  return DOC_TYPES.map((d) => {
    const found = fromApi.find((x) => x.document_type === d.type);
    return {
      document_type: d.type,
      file: found?.file?.id ?? null,
      issued_by: found?.issued_by ?? "",
      issued_date: found?.issued_date ?? null,
      expiry_date: found?.expiry_date ?? null,
      remarks: found?.remarks ?? d.remarks,
    };
  });
}

export function ClientStep(props: {
  mode: "create" | "edit" | "view";
  initial?: any | null;
  onSubmit: (values: ClientInfoValues) => Promise<void>;
  submitLoading: boolean;
  resetKey: string;
}) {
  const readOnly = props.mode === "view";
  const p = props.initial?.profile ?? null;

  const defaults: ClientInfoValues = {
    date_of_birth: p?.date_of_birth_display ?? "",
    date_of_birth_type: "bs",

    gender: (p?.gender ?? "male") as any,
    blood_group: (p?.blood_group ?? "O+") as any,
    nationality: (p?.nationality ?? "Nepali") as any,
    religion: (p?.religion ?? "Hindu") as any,
    mother_tongue: (p?.mother_tongue ?? "Nepali") as any,

    citizenship_no: p?.citizenship_no ?? "",
    pan_no: p?.pan_no ?? "",

    addresses: ensureTwoAddresses(p) as any,
    documents: ensureFiveDocuments(p) as any,
  };

  return (
    <FormWizard
      schema={clientInfoSchema}
      defaultValues={defaults}
      resetKey={props.resetKey}
      blocked={readOnly}
      submitLoading={props.submitLoading}
      submitLabel={props.mode === "create" ? "Submit Admin" : "Update Admin"}
      disableSubmitUntilDirty={props.mode !== "create"}
      onSubmit={async (values) => props.onSubmit(values)}
      render={(methods) => {
        const addresses = useFieldArray({ control: methods.control, name: "addresses" });
        const documents = useFieldArray({ control: methods.control, name: "documents" });

        return (
          <div className="space-y-6">
            {/* Top fields */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NepaliBsDatePickerField<ClientInfoValues>
                control={methods.control as any}
                name="date_of_birth"
                label="Date of Birth (BS)"
                disabled={readOnly}
              />


              <GenderSelectField control={methods.control} name="gender" required disabled={readOnly} />

              <BloodGroupSelectField control={methods.control} name="blood_group" required disabled={readOnly} />
              <NationalitySelectField control={methods.control} name="nationality" required disabled={readOnly} />
              <ReligionSelectField control={methods.control} name="religion" required disabled={readOnly} />
              <MotherTongueSelectField control={methods.control} name="mother_tongue" required disabled={readOnly} />

              <InputField
                label="Citizenship No"
                required
                disabled={readOnly}
                {...methods.register("citizenship_no")}
                error={methods.formState.errors.citizenship_no}
              />

              <InputField
                label="PAN No"
                required
                disabled={readOnly}
                {...methods.register("pan_no")}
                error={methods.formState.errors.pan_no}
              />

              <input type="hidden" value="bs" {...methods.register("date_of_birth_type")} />
            </div>

            {/* Addresses (exactly 2: permanent + temporary, both required) */}
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Addresses</h3>
                <p className="text-xs text-muted-foreground">Permanent and Temporary are required</p>
              </div>

              {addresses.fields.map((f, idx) => (
                <div key={f.id} className="rounded border p-3 space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Controller
                      control={methods.control}
                      name={`addresses.${idx}.address_type` as const}
                      render={({ field, fieldState }) => (
                        <FormSelect
                          label="Type"
                          required
                          disabled={readOnly}
                          value={field.value}
                          onValueChange={field.onChange}
                          error={fieldState.error?.message}
                          options={[
                            { value: "permanent", label: "Permanent" },
                            { value: "temporary", label: "Temporary" },
                          ]}
                        />
                      )}
                    />

                    <InputField
                      label="Province"
                      required
                      disabled={readOnly}
                      {...methods.register(`addresses.${idx}.province` as const)}
                      error={methods.formState.errors.addresses?.[idx]?.province as any}
                    />

                    <InputField
                      label="District"
                      required
                      disabled={readOnly}
                      {...methods.register(`addresses.${idx}.district` as const)}
                      error={methods.formState.errors.addresses?.[idx]?.district as any}
                    />

                    <InputField
                      label="Municipality"
                      required
                      disabled={readOnly}
                      {...methods.register(`addresses.${idx}.municipality` as const)}
                      error={methods.formState.errors.addresses?.[idx]?.municipality as any}
                    />

                    <InputField
                      label="Ward No"
                      required
                      disabled={readOnly}
                      {...methods.register(`addresses.${idx}.ward_no` as const)}
                      error={methods.formState.errors.addresses?.[idx]?.ward_no as any}
                    />

                    <InputField
                      label="Street"
                      required
                      disabled={readOnly}
                      {...methods.register(`addresses.${idx}.street` as const)}
                      error={methods.formState.errors.addresses?.[idx]?.street as any}
                    />

                    <InputField
                      label="Tole"
                      required
                      disabled={readOnly}
                      {...methods.register(`addresses.${idx}.tole` as const)}
                      error={methods.formState.errors.addresses?.[idx]?.tole as any}
                    />

                    <InputField
                      label="Postal Code"
                      required
                      disabled={readOnly}
                      {...methods.register(`addresses.${idx}.postal_code` as const)}
                      error={methods.formState.errors.addresses?.[idx]?.postal_code as any}
                    />

                    <InputField
                      label="House No"
                      disabled={readOnly}
                      {...methods.register(`addresses.${idx}.house_no` as const)}
                      error={methods.formState.errors.addresses?.[idx]?.house_no as any}
                    />

                    <InputField
                      label="Country"
                      required
                      disabled={readOnly}
                      {...methods.register(`addresses.${idx}.country` as const)}
                      error={methods.formState.errors.addresses?.[idx]?.country as any}
                    />
                  </div>

                  {/* Optional: primary toggle can be added, but you didn’t ask for it */}
                </div>
              ))}
            </div>

            {/* Documents (fixed 5, no Add button, uses ImagePickerField) */}
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Documents</h3>
                <p className="text-xs text-muted-foreground">Upload required documents</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.fields.map((f, idx) => {
                  const dt = (methods.getValues(`documents.${idx}.document_type` as const) ??
                    f.document_type) as string;

                  const title =
                    DOC_TYPES.find((x) => x.type === dt)?.title ?? "Document";

                  return (
                    <div key={f.id} className="rounded border p-3">
                      <Controller
                        control={methods.control}
                        name={`documents.${idx}.file` as const}
                        render={({ field, fieldState }) => (
                          <ImagePickerField
                            title={title}
                            hint="Upload file"
                            value={field.value ?? null}
                            onChange={field.onChange}
                            initialUri={null}
                            error={fieldState.error}
                            required={true}
                            fileType="image"
                            deleteOnRemove={false}
                            onUploadStatusChange={() => { }}
                          />
                        )}
                      />

                      {/* Keep the document_type stable */}
                      <input
                        type="hidden"
                        {...methods.register(`documents.${idx}.document_type` as const)}
                      />

                      {/* If your API needs these, keep them hidden or expose later */}
                      <input
                        type="hidden"
                        {...methods.register(`documents.${idx}.remarks` as const)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Optional: issued_by/issued_date fields can be re-added per doc if needed */}
            </div>
          </div>
        );
      }}
    />
  );
}

function FormSelect(props: {
  label: string;
  required?: boolean;
  disabled?: boolean;
  value: string;
  onValueChange: (v: string) => void;
  error?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {props.label} {props.required ? <span className="text-destructive">*</span> : null}
      </label>

      <Select value={props.value} onValueChange={props.onValueChange} disabled={props.disabled}>
        <SelectTrigger className={props.error ? "border-destructive" : ""}>
          <SelectValue placeholder={`Select ${props.label}`} />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {props.error ? <p className="text-xs text-destructive">{props.error}</p> : null}
    </div>
  );
}
