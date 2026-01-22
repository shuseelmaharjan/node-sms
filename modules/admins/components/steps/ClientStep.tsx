"use client";

import * as React from "react";
import { Controller, useFieldArray } from "react-hook-form";

import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/form/InputField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
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
import { NepalAddressFields } from "@/components/address/NepalAddressFields";


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

    gender: (p?.gender ?? "Male") as any,
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
      onSubmit={async (values) => {
        console.log("Form submission values:", values);
        await props.onSubmit(values);
      }}
      render={(methods) => {
        const documents = useFieldArray({ control: methods.control, name: "documents" });

        return (
          <div className="space-y-6">
            {/* Top fields */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-3 rounded-lg border">
              <NepaliBsDatePickerField<ClientInfoValues>
                control={methods.control as any}
                name="date_of_birth"
                label="Date of Birth (BS)"
                disabled={readOnly}
                required
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
            <div className="grid grid-cols-1 gap-6 space-y-6">
              <NepalAddressFields<ClientInfoValues>
                title="Permanent Address"
                baseName={"addresses.0" as any}
                control={methods.control}
                register={methods.register}
                setValue={methods.setValue}
                watch={methods.watch}
                errors={methods.formState.errors}
                disabled={readOnly}
              />
              <NepalAddressFields<ClientInfoValues>
                title="Temporary Address"
                baseName={"addresses.1" as any}
                control={methods.control}
                register={methods.register}
                setValue={methods.setValue}
                watch={methods.watch}
                errors={methods.formState.errors}
                disabled={readOnly}
              />
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
