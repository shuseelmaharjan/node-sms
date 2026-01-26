"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

import { api } from "@/api";
import { FormWizard } from "@/components/form/FormWizard";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/fields/InputField";
import { DatePickerField } from "@/components/fields/DatePickerField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { NepaliBsDatePickerField } from "@/components/nepaliDate/NepaliBsDatePickerField";
import NepaliDate from "nepali-date-converter";
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

import {
  onboardingAdminSchema,
  type OnboardingAdminValues,
} from "../schema/onboarding-admin.schema";

import type { OnboardingAdminEntity } from "../columns/onboarding-admin.columns";

const LIST_URL = "/api/onboarding/admin/";
const DETAIL_URL = (id: string) => `/api/onboarding/admin/${id}/`;

// Remove "+977" for editing convenience
function normalizePhoneForForm(phone?: string | null) {
  if (!phone) return "";
  return String(phone).replace(/^\+977/, "").trim();
}

const createDefaults: OnboardingAdminValues = {
  user: { first_name: "", middle_name: "", last_name: "", phone: "", email: "" },
  school: {
    code: "",
    name: "",
    address: "",
    phone: "",
    email: "",
    logo_file: "",
    pan_number: "",
    registration_number: "",
    pan_document_file: "",
    registration_document_file: "",
  },
  profile: {
    date_of_birth_ad: "",
    date_of_birth_bs: "",
    gender: "",
    blood_group: "",
    nationality: "",
    religion: "",
    mother_tongue: "",
    citizenship_no: "",
    pan_no: "",
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
    photo_file: "",
    citizenship_front_file: "",
    citizenship_back_file: "",
    pan_file: "",
    signature_file: "",
  },
};

function pickAddress(entity: OnboardingAdminEntity, type: "permanent" | "temporary") {
  const a = entity.addresses?.find((x) => x.address_type === type);
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

function toDefaults(entity: OnboardingAdminEntity): OnboardingAdminValues {
  return {
    user: {
      first_name: entity.user.first_name ?? "",
      middle_name: entity.user.middle_name ?? "",
      last_name: entity.user.last_name ?? "",
      phone: normalizePhoneForForm(entity.user.phone),
      email: entity.user.email ?? "",
    },
    school: {
      code: entity.school.code ?? "",
      name: entity.school.name ?? "",
      address: entity.school.address ?? "",
      phone: normalizePhoneForForm(entity.school.phone),
      email: entity.school.email ?? "",
      logo_file: entity.school.logo_file?.id ?? "",
      pan_number: entity.school.pan_number ?? "",
      registration_number: entity.school.registration_number ?? "",
      pan_document_file: entity.school.pan_document_file?.id ?? "",
      registration_document_file: entity.school.registration_document_file?.id ?? "",
    },
    profile: {
      date_of_birth_ad: entity.profile?.date_of_birth_in_ad ?? "",
      date_of_birth_bs: entity.profile?.date_of_birth_in_bs ?? "",
      gender: entity.profile?.gender ?? "",
      blood_group: entity.profile?.blood_group ?? "",
      nationality: entity.profile?.nationality ?? "",
      religion: entity.profile?.religion ?? "",
      mother_tongue: entity.profile?.mother_tongue ?? "",
      citizenship_no: entity.profile?.citizenship_no ?? "",
      pan_no: entity.profile?.pan_no ?? "",
    },
    addresses: [pickAddress(entity, "permanent"), pickAddress(entity, "temporary")],
    documents: {
      photo_file: entity.documents?.photo?.file?.id ?? "",
      citizenship_front_file: entity.documents?.citizenship_front?.file?.id ?? "",
      citizenship_back_file: entity.documents?.citizenship_back?.file?.id ?? "",
      pan_file: entity.documents?.pan?.file?.id ?? "",
      signature_file: entity.documents?.signature?.file?.id ?? "",
    },
  };
}

function toPayload(values: OnboardingAdminValues) {
  return {
    user: {
      first_name: values.user.first_name,
      middle_name: values.user.middle_name || "",
      last_name: values.user.last_name,
      phone: values.user.phone,
      email: values.user.email,
    },
    school: {
      code: values.school.code,
      name: values.school.name,
      address: values.school.address,
      phone: values.school.phone,
      email: values.school.email,
      logo_file: values.school.logo_file,
      pan_number: values.school.pan_number,
      registration_number: values.school.registration_number,
      pan_document_file: values.school.pan_document_file,
      registration_document_file: values.school.registration_document_file,
    },
    profile: {
      date_of_birth_ad: values.profile.date_of_birth_ad,
      gender: values.profile.gender,
      blood_group: values.profile.blood_group,
      nationality: values.profile.nationality,
      religion: values.profile.religion,
      mother_tongue: values.profile.mother_tongue,
      citizenship_no: values.profile.citizenship_no,
      pan_no: values.profile.pan_no,
    },
    addresses: values.addresses.map((a) => ({
      ...(a.id ? { id: a.id } : {}),
      address_type: a.address_type,
      province: a.province,
      district: a.district,
      municipality: a.municipality,
      ward_no: a.ward_no,
      country: a.country,
      street: a.street,
      tole: a.tole,
      house_no: a.house_no,
      postal_code: a.postal_code,
      is_primary: a.is_primary,
    })),
    documents: {
      photo: { file: values.documents.photo_file },
      citizenship_front: {
        file: values.documents.citizenship_front_file,
      },
      citizenship_back: {
        file: values.documents.citizenship_back_file,
      },
      pan: {
        file: values.documents.pan_file,
      },
      signature: { file: values.documents.signature_file },
    },
  };
}

export function AdminsFormPage(props: { mode: "create" | "edit" }) {
  const router = useRouter();
  const params = useParams();

  const id = props.mode === "edit" ? String((params as any).id ?? "") : "";

  const qc = useQueryClient();

  // upload busy stable handlers (prevents max depth loop)
  const [uploadBusy, setUploadBusy] = React.useState<Record<string, boolean>>({});
  const setBusy = React.useCallback((key: string, busy: boolean) => {
    setUploadBusy((prev) => {
      if (prev[key] === busy) return prev;
      return { ...prev, [key]: busy };
    });
  }, []);
  const externallyBlocked = React.useMemo(
    () => Object.values(uploadBusy).some(Boolean),
    [uploadBusy]
  );

  const detailQuery = useQuery({
    queryKey: ["onboarding-admin", "detail", id || null],
    enabled: props.mode === "edit" && Boolean(id),
    queryFn: async () => {
      const res = await api.get<OnboardingAdminEntity>(DETAIL_URL(id));
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: OnboardingAdminValues) => {
      const res = await api.post(LIST_URL, toPayload(values));
      return res.data as any;
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["onboarding-admin", "list"] });
      // Toast is handled by ToastInterceptor from server response
      router.push("/admins");
      router.refresh();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: OnboardingAdminValues) => {
      const res = await api.put(DETAIL_URL(id), toPayload(values));
      return res.data as any;
    },
    onSuccess: async (resp) => {
      await qc.invalidateQueries({ queryKey: ["onboarding-admin", "list"] });
      await qc.invalidateQueries({ queryKey: ["onboarding-admin", "detail", id] });
      // Toast is handled by ToastInterceptor from server response
      router.push("/admins");
      router.refresh();
    },
  });

  const blocked =
    detailQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending;

  const entity = detailQuery.data ?? null;

  const defaultValues = React.useMemo<OnboardingAdminValues>(() => {
    if (props.mode === "edit" && entity) return toDefaults(entity);
    return createDefaults;
  }, [props.mode, entity]);

  const resetKey = React.useMemo(() => {
    if (props.mode === "create") return "create";
    return entity ? `edit-${id}-ready` : `edit-${id}-loading`;
  }, [props.mode, entity, id]);

  const initialUrls = React.useMemo(() => {
    const e = entity;
    return {
      school_logo: e?.school?.logo_file?.file_url ?? null,
      school_pan_doc: e?.school?.pan_document_file?.file_url ?? null,
      school_reg_doc: e?.school?.registration_document_file?.file_url ?? null,

      doc_photo: e?.documents?.photo?.file?.file_url ?? null,
      doc_cfront: e?.documents?.citizenship_front?.file?.file_url ?? null,
      doc_cback: e?.documents?.citizenship_back?.file?.file_url ?? null,
      doc_pan: e?.documents?.pan?.file?.file_url ?? null,
      doc_signature: e?.documents?.signature?.file?.file_url ?? null,
    };
  }, [entity]);

  const title = props.mode === "create" ? "Add Admin" : "Update Admin";

  return (
    <PageShell
      title={title}
      description={props.mode === "create" ? "Create a new admin onboarding." : "Update admin onboarding."}
      actions={
        <Button variant="outline" asChild>
          <Link href="/admins">Back</Link>
        </Button>
      }
    >
      <FormWizard
        schema={onboardingAdminSchema}
        defaultValues={defaultValues}
        resetKey={resetKey}
        blocked={blocked}
        externallyBlocked={externallyBlocked}
        submitLoading={createMutation.isPending || updateMutation.isPending}
        submitLabel={props.mode === "create" ? "Create" : "Update"}
        disableSubmitUntilDirty={true}
        onSubmit={async (values, methods) => {
          try {
            if (props.mode === "create") {
              await createMutation.mutateAsync(values);
            } else {
              await updateMutation.mutateAsync(values);
            }
          } catch (error) {
            // Map server errors to form fields
            // ToastInterceptor already handles toast notifications
            handleFormError(error, {
              setError: methods.setError,
            });
          }
        }}
        render={(methods) => {
          // Watch for date changes and synchronize BS <-> AD
          const bsDate = methods.watch("profile.date_of_birth_bs");
          const adDate = methods.watch("profile.date_of_birth_ad");
          
          React.useEffect(() => {
            // Convert BS to AD when BS date changes
            if (bsDate && bsDate.length === 10) {
              try {
                const [year, month, day] = bsDate.split("-").map(Number);
                const nepaliDate = new NepaliDate(year, month - 1, day);
                const englishDate = nepaliDate.toJsDate();
                const formatted = format(englishDate, "yyyy-MM-dd");
                
                if (adDate !== formatted) {
                  methods.setValue("profile.date_of_birth_ad", formatted, { 
                    shouldValidate: false,
                    shouldDirty: true 
                  });
                }
              } catch (error) {
                console.error("Error converting BS to AD:", error);
              }
            }
          }, [bsDate]);

          React.useEffect(() => {
            // Convert AD to BS when AD date changes
            if (adDate && adDate.length === 10) {
              try {
                const englishDate = new Date(adDate);
                const nepaliDate = new NepaliDate(englishDate);
                const formatted = nepaliDate.format("YYYY-MM-DD");
                
                if (bsDate !== formatted) {
                  methods.setValue("profile.date_of_birth_bs", formatted, { 
                    shouldValidate: false,
                    shouldDirty: true 
                  });
                }
              } catch (error) {
                console.error("Error converting AD to BS:", error);
              }
            }
          }, [adDate]);

          return (
          <div className="space-y-6">
            {/* USER */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="font-medium">User Information</div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InputField
                  label="First name"
                  required
                  placeholder="First Name"
                  disabled={blocked}
                  {...methods.register("user.first_name")}
                  error={methods.formState.errors.user?.first_name as any}
                />
                <InputField
                  label="Middle name"
                  placeholder="Middle Name"
                  disabled={blocked}
                  {...methods.register("user.middle_name")}
                  error={methods.formState.errors.user?.middle_name as any}
                />
                <InputField
                  label="Last name"
                  placeholder="Last Name"
                  required
                  disabled={blocked}
                  {...methods.register("user.last_name")}
                  error={methods.formState.errors.user?.last_name as any}
                />

                <InputField
                  label="Phone"
                  required
                  disabled={blocked}
                  placeholder="Phone number"
                  {...methods.register("user.phone")}
                  error={methods.formState.errors.user?.phone as any}
                />
                <InputField
                  label="Email"
                  required
                  disabled={blocked}
                  placeholder="name@domain.com"
                  {...methods.register("user.email")}
                  error={methods.formState.errors.user?.email as any}
                />
              </div>
            </div>

            {/* SCHOOL */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="font-medium">School Information</div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField label="Code" required disabled={blocked} placeholder="School Code" {...methods.register("school.code")}
                  error={methods.formState.errors.school?.code as any} />
                <InputField label="Name" required disabled={blocked} placeholder="School Name" {...methods.register("school.name")}
                  error={methods.formState.errors.school?.name as any} />
                <InputField label="Address" required disabled={blocked} placeholder="School Address" {...methods.register("school.address")}
                  error={methods.formState.errors.school?.address as any} />
                <InputField label="Phone" required disabled={blocked} placeholder="School Phone" {...methods.register("school.phone")}
                  error={methods.formState.errors.school?.phone as any} />
                <InputField label="Email" required disabled={blocked} placeholder="School Email" {...methods.register("school.email")}
                  error={methods.formState.errors.school?.email as any} />
                <InputField label="PAN number" required disabled={blocked} placeholder="School PAN Number" {...methods.register("school.pan_number")}
                  error={methods.formState.errors.school?.pan_number as any} />
                <InputField label="Registration number" required disabled={blocked} placeholder="School Registration Number" {...methods.register("school.registration_number")}
                  error={methods.formState.errors.school?.registration_number as any} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Controller
                  control={methods.control}
                  name="school.logo_file"
                  render={({ field, fieldState }) => (
                    <ImagePickerField
                      title="Logo"
                      required
                      value={field.value || null}
                      initialUri={initialUrls.school_logo}
                      onChange={(id) => field.onChange(id)}
                      error={fieldState.error as any}
                      onUploadStatusChange={(busy) => setBusy("school_logo", busy)}
                    />
                  )}
                />
                <Controller
                  control={methods.control}
                  name="school.pan_document_file"
                  render={({ field, fieldState }) => (
                    <ImagePickerField
                      title="PAN Document"
                      required
                      value={field.value || null}
                      initialUri={initialUrls.school_pan_doc}
                      onChange={(id) => field.onChange(id)}
                      error={fieldState.error as any}
                      onUploadStatusChange={(busy) => setBusy("school_pan_doc", busy)}
                    />
                  )}
                />
                <Controller
                  control={methods.control}
                  name="school.registration_document_file"
                  render={({ field, fieldState }) => (
                    <ImagePickerField
                      title="Registration Document"
                      required
                      value={field.value || null}
                      initialUri={initialUrls.school_reg_doc}
                      onChange={(id) => field.onChange(id)}
                      error={fieldState.error as any}
                      onUploadStatusChange={(busy) => setBusy("school_reg_doc", busy)}
                    />
                  )}
                />
              </div>
            </div>

            {/* PROFILE */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="font-medium">Profile Information</div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <Controller
                  control={methods.control}
                  name="profile.date_of_birth_bs"
                  render={({ field }) => (
                    <NepaliBsDatePickerField
                      control={methods.control}
                      name={"profile.date_of_birth_bs" as any}
                      label="Date of birth (BS)"
                      disabled={blocked}
                      required={true}
                    />
                  )}
                />

                <Controller
                  control={methods.control}
                  name="profile.date_of_birth_ad"
                  render={({ field }) => (
                    <DatePickerField
                      control={methods.control}
                      name={"profile.date_of_birth_ad" as any}
                      label="Date of birth (AD)"
                      disabled={blocked}
                      required={true}
                    />
                  )}
                />


                <GenderSelectField control={methods.control} name={"profile.gender" as any} required disabled={blocked} />
                <BloodGroupSelectField control={methods.control} name={"profile.blood_group" as any} required disabled={blocked} />
                <NationalitySelectField control={methods.control} name={"profile.nationality" as any} required disabled={blocked} />
                <ReligionSelectField control={methods.control} name={"profile.religion" as any} required disabled={blocked} />
                <MotherTongueSelectField control={methods.control} name={"profile.mother_tongue" as any} required disabled={blocked} />

                <InputField
                  label="Citizenship no"
                  required
                  placeholder="Citizenship no"
                  disabled={blocked}
                  {...methods.register("profile.citizenship_no")}
                  error={methods.formState.errors.profile?.citizenship_no as any}
                />
                <InputField
                  label="PAN no"
                  placeholder="Pan no"
                  required
                  disabled={blocked}
                  {...methods.register("profile.pan_no")}
                  error={methods.formState.errors.profile?.pan_no as any}
                />
              </div>
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  name="documents.signature_file"
                  render={({ field, fieldState }) => (
                    <ImagePickerField
                      title="Signature"
                      required
                      value={field.value || null}
                      initialUri={initialUrls.doc_signature}
                      onChange={(id) => field.onChange(id)}
                      error={fieldState.error as any}
                      onUploadStatusChange={(busy) => setBusy("doc_signature", busy)}
                    />
                  )}
                />
                <Controller
                  control={methods.control}
                  name="documents.pan_file"
                  render={({ field, fieldState }) => (
                    <ImagePickerField
                      title="PAN File"
                      required
                      value={field.value || null}
                      initialUri={initialUrls.doc_pan}
                      onChange={(id) => field.onChange(id)}
                      error={fieldState.error as any}
                      onUploadStatusChange={(busy) => setBusy("doc_pan", busy)}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  control={methods.control}
                  name="documents.citizenship_front_file"
                  render={({ field, fieldState }) => (
                    <ImagePickerField
                      title="Citizenship Front"
                      required
                      value={field.value || null}
                      initialUri={initialUrls.doc_cfront}
                      onChange={(id) => field.onChange(id)}
                      error={fieldState.error as any}
                      onUploadStatusChange={(busy) => setBusy("doc_cfront", busy)}
                    />
                  )}
                />
                <Controller
                  control={methods.control}
                  name="documents.citizenship_back_file"
                  render={({ field, fieldState }) => (
                    <ImagePickerField
                      title="Citizenship Back"
                      required
                      value={field.value || null}
                      initialUri={initialUrls.doc_cback}
                      onChange={(id) => field.onChange(id)}
                      error={fieldState.error as any}
                      onUploadStatusChange={(busy) => setBusy("doc_cback", busy)}
                    />
                  )}
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
