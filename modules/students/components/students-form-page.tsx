// modules/students/components/students-form-page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api";
import { FormWizard } from "@/components/form/FormWizard";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/fields/InputField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { NepaliBsDatePickerField } from "@/components/nepaliDate/NepaliBsDatePickerField";

import {
  BloodGroupSelectField,
  GenderSelectField,
  MotherTongueSelectField,
  NationalitySelectField,
  ReligionSelectField,
} from "@/components/select";
import { NepalAddressFields } from "@/components/address/NepalAddressFields";
import { PageShell } from "@/components/layout/PageShell";
import { handleFormError } from "@/lib/handleFormError";
import { convertBsToAd, convertAdToBs } from "@/lib/date-utils";

import { SwitchField } from "@/components/fields/SwitchField";
import { TextareaField } from "@/components/fields/TextareaField";

import { studentSchema, type StudentValues } from "../schema/student.schema";
import type { StudentEntity } from "../columns/student.columns";

const LIST_URL = "/api/onboarding/students/";
const DETAIL_URL = (id: string) => `/api/onboarding/students/${id}/`;

function normalizePhoneForForm(phone?: string | null) {
  if (!phone) return "";
  return String(phone).replace(/^\+977/, "").trim();
}

function formatPhoneForApi(phone: string) {
  const raw = (phone ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  return `+977${raw}`;
}

const createDefaults: StudentValues = {
  user: { first_name: "", middle_name: "", last_name: "", phone: "", email: "" },
  profile: {
    date_of_birth_bs: "",
    gender: "",
    blood_group: "",
    nationality: "",
    religion: "",
    mother_tongue: "",
    citizenship_no: "",
    pan_no: "",
  },
  guardians: {
    father_name: "",
    father_phone: "",
    father_email: "",

    mother_name: "",
    mother_phone: "",
    mother_email: "",

    guardian_name: "",
    guardian_phone: "",
    guardian_email: "",
  },
  addresses: [
    {
      address_type: "permanent",
      province: "",
      district: "",
      municipality: "",
      ward_no: "",
      country: "Nepal",
      street: "",
      tole: "",
      house_no: "",
      postal_code: "",
      is_primary: true,
    },
    {
      address_type: "temporary",
      province: "",
      district: "",
      municipality: "",
      ward_no: "",
      country: "Nepal",
      street: "",
      tole: "",
      house_no: "",
      postal_code: "",
      is_primary: false,
    },
  ],
  documents: {
    photo_id: "",
    photo_file: "",
    birth_certificate_id: "",
    birth_certificate_file: "",
    transfer_certificate_id: "",
    transfer_certificate_file: "",
    marksheet_id: "",
    marksheet_file: "",
  },
  other_info: {
    is_disabled: false,
    disability_details: "",
    visual_issues: false,
    hearing_issues: false,
    mobility_issues: false,
    chronic_illness: false,
    chronic_illness_details: "",
    allergies: false,
    allergy_details: "",
    medications: false,
    medication_details: "",
    dietary_restrictions: false,
    dietary_restriction_details: "",
    other_health_issues: false,
    other_health_issue_details: "",
  },
};

function pickAddress(entity: StudentEntity, type: "permanent" | "temporary") {
  const a = entity.profile?.addresses?.find((x: any) => x.address_type === type);
  return {
    id: a?.id,
    address_type: type,
    province: a?.province ?? "",
    district: a?.district ?? "",
    municipality: a?.municipality ?? "",
    ward_no: a?.ward_no ?? "",
    country: a?.country ?? "Nepal",
    street: a?.street ?? "",
    tole: a?.tole ?? "",
    house_no: a?.house_no ?? "",
    postal_code: a?.postal_code ?? "",
    is_primary: Boolean(a?.is_primary ?? (type === "permanent")),
  };
}

function toDefaults(entity: StudentEntity): StudentValues {
  const docs = (entity.profile?.documents ?? {}) as any;

  // backend returns student_other_info as array (unique constraint => first item)
  const oiArr = (entity.profile as any)?.student_other_info ?? [];
  const oi = oiArr?.[0] ?? null;

  const dobAd = entity.profile?.date_of_birth_in_ad ?? "";
  const dobBs =
    entity.profile?.date_of_birth_in_bs ??
    (dobAd ? convertAdToBs(dobAd) ?? "" : "");

  const gs = ((entity.profile as any)?.guardians ?? []) as any[];

  const father = gs.find((x) => x.relation === "father");
  const mother = gs.find((x) => x.relation === "mother");
  const guardian = gs.find((x) => x.relation === "guardian");

  return {
    user: {
      first_name: entity.first_name ?? "",
      middle_name: entity.middle_name ?? "",
      last_name: entity.last_name ?? "",
      phone: normalizePhoneForForm(entity.phone),
      email: entity.email ?? "",
    },
    profile: {
      date_of_birth_bs: dobBs ?? "",
      gender: entity.profile?.gender ?? "",
      blood_group: entity.profile?.blood_group ?? "",
      nationality: entity.profile?.nationality ?? "",
      religion: entity.profile?.religion ?? "",
      mother_tongue: entity.profile?.mother_tongue ?? "",
      citizenship_no: entity.profile?.citizenship_no ?? "",
      pan_no: entity.profile?.pan_no ?? "",
    },
    guardians: {
      father_name: father?.full_name ?? "",
      father_phone: normalizePhoneForForm(father?.phone ?? ""),
      father_email: father?.email ?? "",

      mother_name: mother?.full_name ?? "",
      mother_phone: normalizePhoneForForm(mother?.phone ?? ""),
      mother_email: mother?.email ?? "",

      guardian_name: guardian?.full_name ?? "",
      guardian_phone: normalizePhoneForForm(guardian?.phone ?? ""),
      guardian_email: guardian?.email ?? "",
    },
    addresses: [pickAddress(entity, "permanent"), pickAddress(entity, "temporary")],
    documents: {
      photo_id: docs?.photo?.id ?? "",
      photo_file: docs?.photo?.file?.id ?? "",

      birth_certificate_id: docs?.birth_certificate?.id ?? "",
      birth_certificate_file: docs?.birth_certificate?.file?.id ?? "",

      transfer_certificate_id: docs?.transfer_certificate?.id ?? "",
      transfer_certificate_file: docs?.transfer_certificate?.file?.id ?? "",

      marksheet_id: docs?.marksheet?.id ?? "",
      marksheet_file: docs?.marksheet?.file?.id ?? "",
    },
    other_info: {
      is_disabled: Boolean(oi?.is_disabled ?? false),
      disability_details: oi?.disability_details ?? "",
      visual_issues: Boolean(oi?.visual_issues ?? false),
      hearing_issues: Boolean(oi?.hearing_issues ?? false),
      mobility_issues: Boolean(oi?.mobility_issues ?? false),
      chronic_illness: Boolean(oi?.chronic_illness ?? false),
      chronic_illness_details: oi?.chronic_illness_details ?? "",
      allergies: Boolean(oi?.allergies ?? false),
      allergy_details: oi?.allergy_details ?? "",
      medications: Boolean(oi?.medications ?? false),
      medication_details: oi?.medication_details ?? "",
      dietary_restrictions: Boolean(oi?.dietary_restrictions ?? false),
      dietary_restriction_details: oi?.dietary_restriction_details ?? "",
      other_health_issues: Boolean(oi?.other_health_issues ?? false),
      other_health_issue_details: oi?.other_health_issue_details ?? "",
    },
  };
}

function isTemporaryAddressFilled(a: any) {
  if (!a) return false;
  return Boolean(a.province || a.district || a.municipality || a.ward_no || a.tole);
}

function docObj(fileId: string, issuedDate?: string, id?: string) {
  if (!fileId) return null;
  return {
    ...(id ? { id } : {}),
    file: fileId,
    remarks: "",
    issued_by: "",
    issued_date: issuedDate || "",
    expiry_date: issuedDate || "",
  };
}

function buildGuardians(values: StudentValues) {
  const out: any[] = [];

  const fName = (values.guardians?.father_name || "").trim();
  const mName = (values.guardians?.mother_name || "").trim();
  const gName = (values.guardians?.guardian_name || "").trim();

  const fPhone = formatPhoneForApi(values.guardians?.father_phone || "");
  const mPhone = formatPhoneForApi(values.guardians?.mother_phone || "");
  const gPhone = formatPhoneForApi(values.guardians?.guardian_phone || "");

  const fEmail = (values.guardians?.father_email || "").trim();
  const mEmail = (values.guardians?.mother_email || "").trim();
  const gEmail = (values.guardians?.guardian_email || "").trim();

  if (fName)
    out.push({
      relation: "father",
      full_name: fName,
      phone: fPhone || "",
      email: fEmail || "",
      occupation: "",
      is_primary: true,
    });

  if (mName)
    out.push({
      relation: "mother",
      full_name: mName,
      phone: mPhone || "",
      email: mEmail || "",
      occupation: "",
      is_primary: out.length === 0,
    });

  if (gName)
    out.push({
      relation: "guardian",
      full_name: gName,
      phone: gPhone || "",
      email: gEmail || "",
      occupation: "",
      is_primary: out.length === 0,
    });

  return out;
}

function toPayload(values: StudentValues) {
  const dobAd = convertBsToAd(values.profile.date_of_birth_bs) || "";

  const addresses = values.addresses
    .filter((a) => (a.address_type === "permanent" ? true : isTemporaryAddressFilled(a)))
    .map((a) => ({
      ...(a.id ? { id: a.id } : {}),
      address_type: a.address_type,
      province: a.province,
      district: a.district,
      municipality: a.municipality,
      ward_no: a.ward_no,
      country: a.country || "Nepal",
      street: a.street,
      tole: a.tole,
      house_no: a.house_no,
      postal_code: a.postal_code,
      is_primary: a.is_primary,
    }));

  const docs: any = {
    photo: docObj(values.documents.photo_file, dobAd, values.documents.photo_id || undefined),
    birth_certificate: docObj(
      values.documents.birth_certificate_file,
      dobAd,
      values.documents.birth_certificate_id || undefined
    ),
  };

  const tc = docObj(
    values.documents.transfer_certificate_file || "",
    dobAd,
    values.documents.transfer_certificate_id || undefined
  );
  if (tc) docs.transfer_certificate = tc;

  const ms = docObj(
    values.documents.marksheet_file || "",
    dobAd,
    values.documents.marksheet_id || undefined
  );
  if (ms) docs.marksheet = ms;

  return {
    user: {
      first_name: values.user.first_name,
      middle_name: values.user.middle_name || "",
      last_name: values.user.last_name,
      phone: formatPhoneForApi(values.user.phone),
      email: values.user.email || "",
    },
    profile: {
      date_of_birth_ad: dobAd,
      date_of_birth_bs: values.profile.date_of_birth_bs,
      gender: values.profile.gender,
      blood_group: values.profile.blood_group,
      nationality: values.profile.nationality,
      religion: values.profile.religion,
      mother_tongue: values.profile.mother_tongue,
      citizenship_no: values.profile.citizenship_no || "",
      pan_no: values.profile.pan_no || "",
    },
    guardians: buildGuardians(values),
    addresses,
    documents: docs,
    other_info: values.other_info,
  };
}

export function StudentsFormPage(props: { mode: "create" | "edit" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = props.mode === "edit" ? searchParams.get("user_id") || "" : "";

  const qc = useQueryClient();

  const [uploadBusy, setUploadBusy] = React.useState<Record<string, boolean>>({});
  const setBusy = React.useCallback((key: string, busy: boolean) => {
    setUploadBusy((prev) => (prev[key] === busy ? prev : { ...prev, [key]: busy }));
  }, []);
  const externallyBlocked = React.useMemo(
    () => Object.values(uploadBusy).some(Boolean),
    [uploadBusy]
  );

  const detailQuery = useQuery({
    queryKey: ["students", "detail", id || null],
    enabled: props.mode === "edit" && Boolean(id),
    queryFn: async () => {
      const res = await api.get<StudentEntity>(DETAIL_URL(id));
      return (res.data as any).data ?? res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: StudentValues) => {
      const res = await api.post(LIST_URL, toPayload(values));
      return res.data as any;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["students", "list"] });
      router.push("/student-enrollment");
      router.refresh();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: StudentValues) => {
      const res = await api.put(DETAIL_URL(id), toPayload(values));
      return res.data as any;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["students", "list"] });
      await qc.invalidateQueries({ queryKey: ["students", "detail", id] });
      router.push("/student-enrollment");
      router.refresh();
    },
  });

  const blocked = detailQuery.isFetching || createMutation.isPending || updateMutation.isPending;

  const entity = detailQuery.data ?? null;

  const defaultValues = React.useMemo<StudentValues>(() => {
    if (props.mode === "edit" && entity) return toDefaults(entity);
    return createDefaults;
  }, [props.mode, entity]);

  const resetKey = React.useMemo(() => {
    if (props.mode === "create") return "create";
    return entity ? `edit-${id}-ready` : `edit-${id}-loading`;
  }, [props.mode, entity, id]);

  const initialUrls = React.useMemo(() => {
    const e = entity;
    const docs = (e?.profile?.documents ?? {}) as any;
    return {
      doc_photo: docs?.photo?.file?.file_url ?? null,
      doc_birth: docs?.birth_certificate?.file?.file_url ?? null,
      doc_tc: docs?.transfer_certificate?.file?.file_url ?? null,
      doc_marksheet: docs?.marksheet?.file?.file_url ?? null,
    };
  }, [entity]);

  const title = props.mode === "create" ? "Add Student" : "Update Student";

  return (
    <PageShell
      title={title}
      description={props.mode === "create" ? "Create a new student." : "Update student."}
      actions={
        <Button variant="outline" asChild>
          <Link href="/students">Back</Link>
        </Button>
      }
    >
      <FormWizard
        schema={studentSchema}
        defaultValues={defaultValues}
        resetKey={resetKey}
        blocked={blocked}
        externallyBlocked={externallyBlocked}
        submitLoading={createMutation.isPending || updateMutation.isPending}
        submitLabel={props.mode === "create" ? "Create" : "Update"}
        disableSubmitUntilDirty
        onSubmit={async (values, methods) => {
          try {
            if (props.mode === "create") await createMutation.mutateAsync(values);
            else await updateMutation.mutateAsync(values);
          } catch (error) {
            handleFormError(error, { setError: methods.setError });
          }
        }}
        render={(methods) => {
          const dobBs = methods.watch("profile.date_of_birth_bs");

          React.useEffect(() => {
            if (dobBs) convertBsToAd(dobBs);
          }, [dobBs]);

          return (
            <div className="space-y-6">
              {/* USER */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="font-medium">User Information</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InputField
                    label="First name"
                    required
                    disabled={blocked}
                    placeholder="First name"
                    {...methods.register("user.first_name")}
                    error={methods.formState.errors.user?.first_name as any}
                  />
                  <InputField
                    label="Middle name"
                    disabled={blocked}
                    placeholder="Middle name"
                    {...methods.register("user.middle_name")}
                    error={methods.formState.errors.user?.middle_name as any}
                  />
                  <InputField
                    label="Last name"
                    required
                    placeholder="Last name"
                    disabled={blocked}
                    {...methods.register("user.last_name")}
                    error={methods.formState.errors.user?.last_name as any}
                  />
                  <InputField
                    label="Phone"
                    required
                    disabled={blocked}
                    placeholder="98XXXXXXXX"
                    {...methods.register("user.phone")}
                    error={methods.formState.errors.user?.phone as any}
                  />
                  <InputField
                    label="Email (optional)"
                    disabled={blocked}
                    placeholder="name@domain.com"
                    {...methods.register("user.email")}
                    error={methods.formState.errors.user?.email as any}
                  />
                </div>
              </div>

              {/* PROFILE */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="font-medium">Profile Information</div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <NepaliBsDatePickerField
                    control={methods.control}
                    name={"profile.date_of_birth_bs" as any}
                    label="Date of birth (BS)"
                    disabled={blocked}
                    required
                  />

                  <GenderSelectField
                    control={methods.control}
                    name={"profile.gender" as any}
                    required
                    disabled={blocked}
                  />
                  <BloodGroupSelectField
                    control={methods.control}
                    name={"profile.blood_group" as any}
                    required
                    disabled={blocked}
                  />
                  <NationalitySelectField
                    control={methods.control}
                    name={"profile.nationality" as any}
                    required
                    disabled={blocked}
                  />
                  <ReligionSelectField
                    control={methods.control}
                    name={"profile.religion" as any}
                    required
                    disabled={blocked}
                  />
                  <MotherTongueSelectField
                    control={methods.control}
                    name={"profile.mother_tongue" as any}
                    required
                    disabled={blocked}
                  />

                  <InputField
                    label="Citizenship no (optional)"
                    disabled={blocked}
                    {...methods.register("profile.citizenship_no")}
                    error={methods.formState.errors.profile?.citizenship_no as any}
                  />
                  <InputField
                    label="PAN no (optional)"
                    disabled={blocked}
                    {...methods.register("profile.pan_no")}
                    error={methods.formState.errors.profile?.pan_no as any}
                  />
                </div>
              </div>

              {/* GUARDIANS */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="font-medium">Guardian Information</div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InputField
                    label="Father Name"
                    placeholder="Father full name"
                    disabled={blocked}
                    {...methods.register("guardians.father_name")}
                    error={methods.formState.errors.guardians?.father_name as any}
                  />
                  <InputField
                    label="Father Phone (optional)"
                    placeholder="98XXXXXXXX"
                    disabled={blocked}
                    {...methods.register("guardians.father_phone")}
                    error={methods.formState.errors.guardians?.father_phone as any}
                  />
                  <InputField
                    label="Father Email (optional)"
                    placeholder="name@domain.com"
                    disabled={blocked}
                    {...methods.register("guardians.father_email")}
                    error={methods.formState.errors.guardians?.father_email as any}
                  />

                  <InputField
                    label="Mother Name"
                    placeholder="Mother full name"
                    disabled={blocked}
                    {...methods.register("guardians.mother_name")}
                    error={methods.formState.errors.guardians?.mother_name as any}
                  />
                  <InputField
                    label="Mother Phone (optional)"
                    placeholder="98XXXXXXXX"
                    disabled={blocked}
                    {...methods.register("guardians.mother_phone")}
                    error={methods.formState.errors.guardians?.mother_phone as any}
                  />
                  <InputField
                    label="Mother Email (optional)"
                    placeholder="name@domain.com"
                    disabled={blocked}
                    {...methods.register("guardians.mother_email")}
                    error={methods.formState.errors.guardians?.mother_email as any}
                  />

                  <InputField
                    label="Guardian Name"
                    placeholder="Guardian full name"
                    disabled={blocked}
                    {...methods.register("guardians.guardian_name")}
                    error={methods.formState.errors.guardians?.guardian_name as any}
                  />
                  <InputField
                    label="Guardian Phone (optional)"
                    placeholder="98XXXXXXXX"
                    disabled={blocked}
                    {...methods.register("guardians.guardian_phone")}
                    error={methods.formState.errors.guardians?.guardian_phone as any}
                  />
                  <InputField
                    label="Guardian Email (optional)"
                    placeholder="name@domain.com"
                    disabled={blocked}
                    {...methods.register("guardians.guardian_email")}
                    error={methods.formState.errors.guardians?.guardian_email as any}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  At least one guardian name is required. Relation is assigned automatically.
                </p>
              </div>

              {/* ADDRESSES */}
              <div className="space-y-6">
                <NepalAddressFields
                  title="Permanent Address"
                  control={methods.control}
                  register={methods.register}
                  setValue={methods.setValue}
                  watch={methods.watch}
                  errors={methods.formState.errors}
                  disabled={blocked}
                  baseName={"addresses.0" as any}
                />

                <NepalAddressFields
                  title="Temporary Address"
                  control={methods.control}
                  register={methods.register}
                  setValue={methods.setValue}
                  watch={methods.watch}
                  errors={methods.formState.errors}
                  disabled={blocked}
                  baseName={"addresses.1" as any}
                />
              </div>

              {/* DOCUMENTS */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="font-medium">Documents</div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Controller
                    control={methods.control}
                    name="documents.photo_file"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="Photo"
                        required
                        value={field.value || null}
                        initialUri={initialUrls.doc_photo}
                        onChange={(id) => field.onChange(id)}
                        error={fieldState.error as any}
                        onUploadStatusChange={(busy) => setBusy("doc_photo", busy)}
                      />
                    )}
                  />
                  <Controller
                    control={methods.control}
                    name="documents.birth_certificate_file"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="Birth Certificate"
                        required
                        value={field.value || null}
                        initialUri={initialUrls.doc_birth}
                        onChange={(id) => field.onChange(id)}
                        error={fieldState.error as any}
                        onUploadStatusChange={(busy) => setBusy("doc_birth", busy)}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Controller
                    control={methods.control}
                    name="documents.transfer_certificate_file"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="Transfer Certificate (optional)"
                        value={field.value || null}
                        initialUri={initialUrls.doc_tc}
                        onChange={(id) => field.onChange(id)}
                        error={fieldState.error as any}
                        onUploadStatusChange={(busy) => setBusy("doc_tc", busy)}
                      />
                    )}
                  />
                  <Controller
                    control={methods.control}
                    name="documents.marksheet_file"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="Marksheet (optional)"
                        value={field.value || null}
                        initialUri={initialUrls.doc_marksheet}
                        onChange={(id) => field.onChange(id)}
                        error={fieldState.error as any}
                        onUploadStatusChange={(busy) => setBusy("doc_marksheet", busy)}
                      />
                    )}
                  />
                </div>
              </div>

              {/* OTHER INFO */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="font-medium">Health / Other Information</div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <SwitchField
                    label="Is Disabled"
                    checked={methods.watch("other_info.is_disabled")}
                    disabled={blocked}
                    error={methods.formState.errors.other_info?.is_disabled as any}
                    onCheckedChange={(v) =>
                      methods.setValue("other_info.is_disabled", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />

                  <SwitchField
                    label="Visual Issues"
                    checked={methods.watch("other_info.visual_issues")}
                    disabled={blocked}
                    error={methods.formState.errors.other_info?.visual_issues as any}
                    onCheckedChange={(v) =>
                      methods.setValue("other_info.visual_issues", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />

                  <SwitchField
                    label="Hearing Issues"
                    checked={methods.watch("other_info.hearing_issues")}
                    disabled={blocked}
                    error={methods.formState.errors.other_info?.hearing_issues as any}
                    onCheckedChange={(v) =>
                      methods.setValue("other_info.hearing_issues", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />

                  <SwitchField
                    label="Mobility Issues"
                    checked={methods.watch("other_info.mobility_issues")}
                    disabled={blocked}
                    error={methods.formState.errors.other_info?.mobility_issues as any}
                    onCheckedChange={(v) =>
                      methods.setValue("other_info.mobility_issues", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />

                  <SwitchField
                    label="Chronic Illness"
                    checked={methods.watch("other_info.chronic_illness")}
                    disabled={blocked}
                    error={methods.formState.errors.other_info?.chronic_illness as any}
                    onCheckedChange={(v) =>
                      methods.setValue("other_info.chronic_illness", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />

                  <SwitchField
                    label="Allergies"
                    checked={methods.watch("other_info.allergies")}
                    disabled={blocked}
                    error={methods.formState.errors.other_info?.allergies as any}
                    onCheckedChange={(v) =>
                      methods.setValue("other_info.allergies", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />

                  <SwitchField
                    label="Medications"
                    checked={methods.watch("other_info.medications")}
                    disabled={blocked}
                    error={methods.formState.errors.other_info?.medications as any}
                    onCheckedChange={(v) =>
                      methods.setValue("other_info.medications", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />

                  <SwitchField
                    label="Dietary Restrictions"
                    checked={methods.watch("other_info.dietary_restrictions")}
                    disabled={blocked}
                    error={methods.formState.errors.other_info?.dietary_restrictions as any}
                    onCheckedChange={(v) =>
                      methods.setValue("other_info.dietary_restrictions", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />

                  <SwitchField
                    label="Other Health Issues"
                    checked={methods.watch("other_info.other_health_issues")}
                    disabled={blocked}
                    error={methods.formState.errors.other_info?.other_health_issues as any}
                    onCheckedChange={(v) =>
                      methods.setValue("other_info.other_health_issues", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextareaField
                    label="Disability Details"
                    disabled={blocked}
                    rows={3}
                    {...methods.register("other_info.disability_details")}
                    error={methods.formState.errors.other_info?.disability_details as any}
                  />
                  <TextareaField
                    label="Chronic Illness Details"
                    disabled={blocked}
                    rows={3}
                    {...methods.register("other_info.chronic_illness_details")}
                    error={methods.formState.errors.other_info?.chronic_illness_details as any}
                  />
                  <TextareaField
                    label="Allergy Details"
                    disabled={blocked}
                    rows={3}
                    {...methods.register("other_info.allergy_details")}
                    error={methods.formState.errors.other_info?.allergy_details as any}
                  />
                  <TextareaField
                    label="Medication Details"
                    disabled={blocked}
                    rows={3}
                    {...methods.register("other_info.medication_details")}
                    error={methods.formState.errors.other_info?.medication_details as any}
                  />
                  <TextareaField
                    label="Dietary Restriction Details"
                    disabled={blocked}
                    rows={3}
                    {...methods.register("other_info.dietary_restriction_details")}
                    error={methods.formState.errors.other_info?.dietary_restriction_details as any}
                  />
                  <TextareaField
                    label="Other Health Issue Details"
                    disabled={blocked}
                    rows={3}
                    {...methods.register("other_info.other_health_issue_details")}
                    error={methods.formState.errors.other_info?.other_health_issue_details as any}
                  />
                </div>
              </div>
            </div>
          );
        }}
      />
    </PageShell>
  );
}
