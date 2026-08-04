"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import NepaliDate from "nepali-date-converter";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  BloodGroupSelectField,
  GenderSelectField,
  MotherTongueSelectField,
  NationalitySelectField,
  ReligionSelectField,
} from "@/components/select";

import { managementProfileApi } from "../../apis/management-profile.api";
import { useStudentProfileCache } from "../../hooks/use-student-profile-cache";
import {
  personalInfoSchema,
  type PersonalInfoValues,
} from "../../schema/management-profile.schema";
import type { PersonalInfo } from "../../types/management-profile.types";
import { applyManagementApiErrors } from "../../utils/management-form-error";
import { ProfileFormDialog } from "./profile-form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  userId: string;
  role?: string | null;
  personalInfo: PersonalInfo | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function parseLocalAdDate(value: string): Date | null {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function convertAdToBs(adDate: string) {
  const date = parseLocalAdDate(adDate);

  if (!date) return "";

  try {
    return NepaliDate.fromAD(date).format(
      "YYYY-MM-DD"
    );
  } catch {
    return "";
  }
}

function getTodayAdString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizePersonalInfo(
  values: Partial<PersonalInfoValues>
): PersonalInfoValues {
  return {
    date_of_birth_in_ad: normalizeText(
      values.date_of_birth_in_ad
    ),
    date_of_birth_in_bs: normalizeText(
      values.date_of_birth_in_bs
    ),
    gender: normalizeText(values.gender),
    blood_group: normalizeText(
      values.blood_group
    ),
    nationality: normalizeText(
      values.nationality
    ),
    religion: normalizeText(values.religion),
    mother_tongue: normalizeText(
      values.mother_tongue
    ),
    citizenship_no: normalizeText(
      values.citizenship_no
    ),
    pan_no: normalizeText(values.pan_no),
  };
}

function valuesAreEqual(
  first: PersonalInfoValues,
  second: PersonalInfoValues
) {
  return (
    first.date_of_birth_in_ad ===
      second.date_of_birth_in_ad &&
    first.date_of_birth_in_bs ===
      second.date_of_birth_in_bs &&
    first.gender === second.gender &&
    first.blood_group ===
      second.blood_group &&
    first.nationality ===
      second.nationality &&
    first.religion === second.religion &&
    first.mother_tongue ===
      second.mother_tongue &&
    first.citizenship_no ===
      second.citizenship_no &&
    first.pan_no === second.pan_no
  );
}

export function PersonalInfoEditModal({
  open,
  onOpenChange,
  studentId,
  userId,
  role,
  personalInfo,
}: Props) {
  const cache = useStudentProfileCache(
    studentId,
    userId
  );

  const isStudent =
    role?.trim().toLowerCase() ===
    "student";

  const defaults =
    useMemo<PersonalInfoValues>(
      () => ({
        date_of_birth_in_ad:
          personalInfo?.date_of_birth_in_ad ??
          "",
        date_of_birth_in_bs:
          personalInfo?.date_of_birth_in_bs ??
          "",
        gender:
          personalInfo?.gender ?? "",
        blood_group:
          personalInfo?.blood_group ?? "",
        nationality:
          personalInfo?.nationality ?? "",
        religion:
          personalInfo?.religion ?? "",
        mother_tongue:
          personalInfo?.mother_tongue ?? "",
        citizenship_no:
          personalInfo?.citizenship_no ?? "",
        pan_no:
          personalInfo?.pan_no ?? "",
      }),
      [
        personalInfo?.date_of_birth_in_ad,
        personalInfo?.date_of_birth_in_bs,
        personalInfo?.gender,
        personalInfo?.blood_group,
        personalInfo?.nationality,
        personalInfo?.religion,
        personalInfo?.mother_tongue,
        personalInfo?.citizenship_no,
        personalInfo?.pan_no,
      ]
    );

  const methods =
    useForm<PersonalInfoValues>({
      resolver: zodResolver(
        personalInfoSchema
      ),
      defaultValues: defaults,
      mode: "onChange",
    });

  const watchedValues = useWatch({
    control: methods.control,
  });

  const currentValues = useMemo(
    () =>
      normalizePersonalInfo({
        ...defaults,
        ...watchedValues,
      }),
    [defaults, watchedValues]
  );

  const normalizedDefaults = useMemo(
    () =>
      normalizePersonalInfo(defaults),
    [defaults]
  );

  const hasChanges = useMemo(
    () =>
      !valuesAreEqual(
        currentValues,
        normalizedDefaults
      ),
    [currentValues, normalizedDefaults]
  );

  const isCurrentFormValid = useMemo(
    () =>
      personalInfoSchema.safeParse(
        currentValues
      ).success,
    [currentValues]
  );

  useEffect(() => {
    if (!open) return;

    methods.reset(defaults, {
      keepDefaultValues: false,
    });

    methods.clearErrors();
  }, [open, defaults, methods]);

  const mutation = useMutation({
    mutationFn: async (
      values: PersonalInfoValues
    ) => {
      const normalized =
        normalizePersonalInfo(values);

      return managementProfileApi.updatePersonalInfo(
        userId,
        {
          date_of_birth_in_ad:
            normalized.date_of_birth_in_ad,
          date_of_birth_in_bs:
            normalized.date_of_birth_in_bs,
          gender: normalized.gender,
          blood_group:
            normalized.blood_group,
          nationality:
            normalized.nationality,
          religion:
            normalized.religion,
          mother_tongue:
            normalized.mother_tongue,
          citizenship_no:
            normalized.citizenship_no,
          pan_no: normalized.pan_no,
        }
      );
    },

    onSuccess: async (updatedInfo) => {
      cache.setPersonalInfo(
        updatedInfo
      );

      const updatedDefaults =
        normalizePersonalInfo({
          date_of_birth_in_ad:
            updatedInfo.date_of_birth_in_ad,
          date_of_birth_in_bs:
            updatedInfo.date_of_birth_in_bs,
          gender: updatedInfo.gender,
          blood_group:
            updatedInfo.blood_group,
          nationality:
            updatedInfo.nationality,
          religion:
            updatedInfo.religion,
          mother_tongue:
            updatedInfo.mother_tongue,
          citizenship_no:
            updatedInfo.citizenship_no,
          pan_no: updatedInfo.pan_no,
        });

      methods.reset(updatedDefaults, {
        keepDefaultValues: false,
      });

      methods.clearErrors();

      onOpenChange(false);

      toast.success(
        "Personal information updated successfully"
      );

      void cache.refresh();
    },

    onError: (error) => {
      const message =
        applyManagementApiErrors(
          error,
          methods
        );

      toast.error(message);
    },
  });

  const handleOpenChange = (
    nextOpen: boolean
  ) => {
    if (mutation.isPending) return;

    if (!nextOpen) {
      methods.reset(defaults, {
        keepDefaultValues: false,
      });

      methods.clearErrors();
    }

    onOpenChange(nextOpen);
  };

  const canSubmit =
    hasChanges &&
    isCurrentFormValid &&
    !mutation.isPending;

  return (
    <Form {...methods}>
      <ProfileFormDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Edit personal information"
        description="Update the student's personal identity and demographic details."
        submitLabel="Update information"
        busy={mutation.isPending}
        canSubmit={canSubmit}
        onSubmit={methods.handleSubmit(
          async (values) => {
            await mutation.mutateAsync(
              values
            );
          }
        )}
        contentClassName="max-w-3xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={methods.control}
            name="date_of_birth_in_ad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Date of birth (AD)
                  <span className="ml-0.5 text-destructive">
                    *
                  </span>
                </FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    value={field.value ?? ""}
                    min="1940-01-01"
                    max={getTodayAdString()}
                    disabled={
                      mutation.isPending
                    }
                    onChange={(event) => {
                      const adDate =
                        event.target.value;

                      field.onChange(adDate);

                      if (!adDate) {
                        methods.setValue(
                          "date_of_birth_in_bs",
                          "",
                          {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          }
                        );

                        return;
                      }

                      const bsDate =
                        convertAdToBs(adDate);

                      if (!bsDate) {
                        methods.setError(
                          "date_of_birth_in_ad",
                          {
                            type: "validate",
                            message:
                              "Could not convert the selected AD date to BS",
                          }
                        );

                        return;
                      }

                      methods.clearErrors([
                        "date_of_birth_in_ad",
                        "date_of_birth_in_bs",
                      ]);

                      methods.setValue(
                        "date_of_birth_in_ad",
                        adDate,
                        {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        }
                      );

                      methods.setValue(
                        "date_of_birth_in_bs",
                        bsDate,
                        {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        }
                      );
                    }}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={methods.control}
            name="date_of_birth_in_bs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Date of birth (BS) <span className="ml-0.5 text-muted-foreground">Auto set</span>
                </FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    readOnly
                    disabled={
                      mutation.isPending
                    }
                    placeholder="Automatically generated"
                    className="bg-muted/40"
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <GenderSelectField
            control={methods.control}
            name="gender"
            disabled={
              mutation.isPending
            }
          />

          <BloodGroupSelectField
            control={methods.control}
            name="blood_group"
            disabled={
              mutation.isPending
            }
          />

          <NationalitySelectField
            control={methods.control}
            name="nationality"
            disabled={
              mutation.isPending
            }
          />

          <ReligionSelectField
            control={methods.control}
            name="religion"
            disabled={
              mutation.isPending
            }
          />

          <MotherTongueSelectField
            control={methods.control}
            name="mother_tongue"
            disabled={
              mutation.isPending
            }
          />

          {!isStudent ? (
            <>
              <FormField
                control={methods.control}
                name="citizenship_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Citizenship number
                    </FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        value={
                          field.value ?? ""
                        }
                        disabled={
                          mutation.isPending
                        }
                        placeholder="Enter citizenship number"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={methods.control}
                name="pan_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      PAN number
                    </FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        value={
                          field.value ?? ""
                        }
                        disabled={
                          mutation.isPending
                        }
                        inputMode="numeric"
                        placeholder="Enter PAN number"
                        onChange={(
                          event
                        ) => {
                          field.onChange(
                            event.target.value.replace(
                              /\D/g,
                              ""
                            )
                          );
                        }}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : null}
        </div>
      </ProfileFormDialog>
    </Form>
  );
}