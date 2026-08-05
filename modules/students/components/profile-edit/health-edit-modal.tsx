"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { SwitchField } from "@/components/fields/SwitchField";
import { TextareaField } from "@/components/fields/TextareaField";
import { Form } from "@/components/ui/form";

import { managementProfileApi } from "../../apis/management-profile.api";
import { useStudentProfileCache } from "../../hooks/use-student-profile-cache";
import {
  healthSchema,
  type HealthValues,
} from "../../schema/management-profile.schema";
import type { ManagedHealth } from "../../types/management-profile.types";
import { applyManagementApiErrors } from "../../utils/management-form-error";
import { ProfileFormDialog } from "./profile-form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  userId: string;
  health: ManagedHealth | null;
};

type HealthBooleanField =
  | "is_disabled"
  | "visual_issues"
  | "hearing_issues"
  | "mobility_issues"
  | "chronic_illness"
  | "allergies"
  | "medications"
  | "dietary_restrictions"
  | "other_health_issues";

type HealthDetailField =
  | "disability_details"
  | "chronic_illness_details"
  | "allergy_details"
  | "medication_details"
  | "dietary_restriction_details"
  | "other_health_issue_details";

const emptyHealth: HealthValues = {
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
};

function normalizeHealth(
  health: ManagedHealth | null | undefined
): HealthValues {
  return {
    is_disabled: Boolean(health?.is_disabled),
    disability_details: health?.disability_details ?? "",

    visual_issues: Boolean(health?.visual_issues),
    hearing_issues: Boolean(health?.hearing_issues),
    mobility_issues: Boolean(health?.mobility_issues),

    chronic_illness: Boolean(health?.chronic_illness),
    chronic_illness_details: health?.chronic_illness_details ?? "",

    allergies: Boolean(health?.allergies),
    allergy_details: health?.allergy_details ?? "",

    medications: Boolean(health?.medications),
    medication_details: health?.medication_details ?? "",

    dietary_restrictions: Boolean(health?.dietary_restrictions),
    dietary_restriction_details:
      health?.dietary_restriction_details ?? "",

    other_health_issues: Boolean(health?.other_health_issues),
    other_health_issue_details:
      health?.other_health_issue_details ?? "",
  };
}

function createHealthPayload(values: HealthValues): HealthValues {
  return {
    is_disabled: values.is_disabled,
    disability_details: values.is_disabled
      ? (values.disability_details ?? "").trim()
      : "",

    visual_issues: values.visual_issues,
    hearing_issues: values.hearing_issues,
    mobility_issues: values.mobility_issues,

    chronic_illness: values.chronic_illness,
    chronic_illness_details: values.chronic_illness
      ? (values.chronic_illness_details ?? "").trim()
      : "",

    allergies: values.allergies,
    allergy_details: values.allergies
      ? (values.allergy_details ?? "").trim()
      : "",

    medications: values.medications,
    medication_details: values.medications
      ? (values.medication_details ?? "").trim()
      : "",

    dietary_restrictions: values.dietary_restrictions,
    dietary_restriction_details: values.dietary_restrictions
      ? (values.dietary_restriction_details ?? "").trim()
      : "",

    other_health_issues: values.other_health_issues,
    other_health_issue_details: values.other_health_issues
      ? (values.other_health_issue_details ?? "").trim()
      : "",
  };
}

export function HealthEditModal({
  open,
  onOpenChange,
  studentId,
  userId,
  health,
}: Props) {
  const cache = useStudentProfileCache(studentId, userId);

  const defaults = useMemo<HealthValues>(
    () => normalizeHealth(health),
    [health]
  );

  const methods = useForm<HealthValues>({
    resolver: zodResolver(healthSchema),
    defaultValues: emptyHealth,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const {
    control,
    formState: { errors, isDirty },
  } = methods;

  useEffect(() => {
    if (!open) {
      return;
    }

    methods.reset(defaults, {
      keepErrors: false,
      keepDirty: false,
      keepTouched: false,
      keepIsSubmitted: false,
    });

    methods.clearErrors();
  }, [defaults, methods, open]);

  const mutation = useMutation({
    mutationFn: async (values: HealthValues) => {
      const payload = createHealthPayload(values);

      return managementProfileApi.updateHealth(userId, payload);
    },

    onSuccess: async (updatedHealth) => {
      const normalizedHealth = normalizeHealth(updatedHealth);

      cache.setHealth(updatedHealth);

      methods.reset(normalizedHealth, {
        keepErrors: false,
        keepDirty: false,
        keepTouched: false,
      });

      onOpenChange(false);

      toast.success("Health information updated successfully");

      void cache.refresh();
    },

    onError: (error) => {
      const message = applyManagementApiErrors(error, methods);

      toast.error(message);
    },
  });

  const isDisabled = methods.watch("is_disabled");
  const visualIssues = methods.watch("visual_issues");
  const hearingIssues = methods.watch("hearing_issues");
  const mobilityIssues = methods.watch("mobility_issues");
  const chronicIllness = methods.watch("chronic_illness");
  const allergies = methods.watch("allergies");
  const medications = methods.watch("medications");
  const dietaryRestrictions = methods.watch("dietary_restrictions");
  const otherHealthIssues = methods.watch("other_health_issues");

  const updateBooleanField = (
    fieldName: HealthBooleanField,
    checked: boolean
  ) => {
    methods.setValue(fieldName, checked, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const updateConditionalField = (
    booleanField: HealthBooleanField,
    detailField: HealthDetailField,
    checked: boolean
  ) => {
    methods.setValue(booleanField, checked, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    if (!checked) {
      methods.setValue(detailField, "", {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: true,
      });

      methods.clearErrors(detailField);
      return;
    }

    void methods.trigger(detailField);
  };

  const handleSubmit = methods.handleSubmit(
    async (values) => {
      await mutation.mutateAsync(values);
    },
    () => {
      toast.error("Please complete the required health details.");
    }
  );

  return (
    <Form {...methods}>
      <ProfileFormDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (mutation.isPending) {
            return;
          }

          onOpenChange(nextOpen);
        }}
        title="Edit health information"
        description="Maintain accessibility needs, medical conditions and health notes."
        submitLabel="Update health"
        busy={mutation.isPending}
        canSubmit={isDirty && !mutation.isPending}
        onSubmit={handleSubmit}
        contentClassName="max-w-4xl"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SwitchField
            label="Is disabled"
            checked={isDisabled}
            disabled={mutation.isPending}
            error={errors.is_disabled as any}
            onCheckedChange={(checked) =>
              updateConditionalField(
                "is_disabled",
                "disability_details",
                checked
              )
            }
          />

          <SwitchField
            label="Visual issues"
            checked={visualIssues}
            disabled={mutation.isPending}
            error={errors.visual_issues as any}
            onCheckedChange={(checked) =>
              updateBooleanField("visual_issues", checked)
            }
          />

          <SwitchField
            label="Hearing issues"
            checked={hearingIssues}
            disabled={mutation.isPending}
            error={errors.hearing_issues as any}
            onCheckedChange={(checked) =>
              updateBooleanField("hearing_issues", checked)
            }
          />

          <SwitchField
            label="Mobility issues"
            checked={mobilityIssues}
            disabled={mutation.isPending}
            error={errors.mobility_issues as any}
            onCheckedChange={(checked) =>
              updateBooleanField("mobility_issues", checked)
            }
          />

          <SwitchField
            label="Chronic illness"
            checked={chronicIllness}
            disabled={mutation.isPending}
            error={errors.chronic_illness as any}
            onCheckedChange={(checked) =>
              updateConditionalField(
                "chronic_illness",
                "chronic_illness_details",
                checked
              )
            }
          />

          <SwitchField
            label="Allergies"
            checked={allergies}
            disabled={mutation.isPending}
            error={errors.allergies as any}
            onCheckedChange={(checked) =>
              updateConditionalField(
                "allergies",
                "allergy_details",
                checked
              )
            }
          />

          <SwitchField
            label="Medications"
            checked={medications}
            disabled={mutation.isPending}
            error={errors.medications as any}
            onCheckedChange={(checked) =>
              updateConditionalField(
                "medications",
                "medication_details",
                checked
              )
            }
          />

          <SwitchField
            label="Dietary restrictions"
            checked={dietaryRestrictions}
            disabled={mutation.isPending}
            error={errors.dietary_restrictions as any}
            onCheckedChange={(checked) =>
              updateConditionalField(
                "dietary_restrictions",
                "dietary_restriction_details",
                checked
              )
            }
          />

          <SwitchField
            label="Other health issues"
            checked={otherHealthIssues}
            disabled={mutation.isPending}
            error={errors.other_health_issues as any}
            onCheckedChange={(checked) =>
              updateConditionalField(
                "other_health_issues",
                "other_health_issue_details",
                checked
              )
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            control={control}
            name="disability_details"
            render={({ field, fieldState }) => (
              <TextareaField
                label="Disability details"
                rows={3}
                disabled={mutation.isPending || !isDisabled}
                placeholder={
                  isDisabled
                    ? "Describe the disability and required support"
                    : "Enable 'Is disabled' to enter details"
                }
                name={field.name}
                value={field.value ?? ""}
                onChange={(event) => {
                  field.onChange(event.target.value);
                }}
                onBlur={field.onBlur}
                error={fieldState.error as any}
              />
            )}
          />

          <Controller
            control={control}
            name="chronic_illness_details"
            render={({ field, fieldState }) => (
              <TextareaField
                label="Chronic illness details"
                rows={3}
                disabled={mutation.isPending || !chronicIllness}
                placeholder={
                  chronicIllness
                    ? "Describe the chronic illness"
                    : "Enable 'Chronic illness' to enter details"
                }
                name={field.name}
                value={field.value ?? ""}
                onChange={(event) => {
                  field.onChange(event.target.value);
                }}
                onBlur={field.onBlur}
                error={fieldState.error as any}
              />
            )}
          />

          <Controller
            control={control}
            name="allergy_details"
            render={({ field, fieldState }) => (
              <TextareaField
                label="Allergy details"
                rows={3}
                disabled={mutation.isPending || !allergies}
                placeholder={
                  allergies
                    ? "Describe known allergies"
                    : "Enable 'Allergies' to enter details"
                }
                name={field.name}
                value={field.value ?? ""}
                onChange={(event) => {
                  field.onChange(event.target.value);
                }}
                onBlur={field.onBlur}
                error={fieldState.error as any}
              />
            )}
          />

          <Controller
            control={control}
            name="medication_details"
            render={({ field, fieldState }) => (
              <TextareaField
                label="Medication details"
                rows={3}
                disabled={mutation.isPending || !medications}
                placeholder={
                  medications
                    ? "Enter current medication details"
                    : "Enable 'Medications' to enter details"
                }
                name={field.name}
                value={field.value ?? ""}
                onChange={(event) => {
                  field.onChange(event.target.value);
                }}
                onBlur={field.onBlur}
                error={fieldState.error as any}
              />
            )}
          />

          <Controller
            control={control}
            name="dietary_restriction_details"
            render={({ field, fieldState }) => (
              <TextareaField
                label="Dietary restriction details"
                rows={3}
                disabled={
                  mutation.isPending || !dietaryRestrictions
                }
                placeholder={
                  dietaryRestrictions
                    ? "Describe dietary restrictions"
                    : "Enable 'Dietary restrictions' to enter details"
                }
                name={field.name}
                value={field.value ?? ""}
                onChange={(event) => {
                  field.onChange(event.target.value);
                }}
                onBlur={field.onBlur}
                error={fieldState.error as any}
              />
            )}
          />

          <Controller
            control={control}
            name="other_health_issue_details"
            render={({ field, fieldState }) => (
              <TextareaField
                label="Other health issue details"
                rows={3}
                disabled={mutation.isPending || !otherHealthIssues}
                placeholder={
                  otherHealthIssues
                    ? "Describe other relevant health issues"
                    : "Enable 'Other health issues' to enter details"
                }
                name={field.name}
                value={field.value ?? ""}
                onChange={(event) => {
                  field.onChange(event.target.value);
                }}
                onBlur={field.onBlur}
                error={fieldState.error as any}
              />
            )}
          />
        </div>
      </ProfileFormDialog>
    </Form>
  );
}