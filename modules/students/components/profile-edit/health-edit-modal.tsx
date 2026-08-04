"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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

export function HealthEditModal({
  open,
  onOpenChange,
  studentId,
  userId,
  health,
}: Props) {
  const cache = useStudentProfileCache(studentId, userId);

  const defaults = useMemo<HealthValues>(
    () => ({
      ...emptyHealth,
      ...(health ?? {}),
    }),
    [health]
  );

  const methods = useForm<HealthValues>({
    resolver: zodResolver(healthSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;
    methods.reset(defaults);
    methods.clearErrors();
  }, [defaults, methods, open]);

  const mutation = useMutation({
    mutationFn: (values: HealthValues) =>
      managementProfileApi.updateHealth(userId, {
        ...values,
        disability_details: values.is_disabled
          ? values.disability_details
          : "",
        chronic_illness_details: values.chronic_illness
          ? values.chronic_illness_details
          : "",
        allergy_details: values.allergies ? values.allergy_details : "",
        medication_details: values.medications
          ? values.medication_details
          : "",
        dietary_restriction_details: values.dietary_restrictions
          ? values.dietary_restriction_details
          : "",
        other_health_issue_details: values.other_health_issues
          ? values.other_health_issue_details
          : "",
      }),
    onSuccess: async (updatedHealth) => {
      cache.setHealth(updatedHealth);
      onOpenChange(false);
      toast.success("Health information updated successfully");
      void cache.refresh();
    },
    onError: (error) => {
      toast.error(applyManagementApiErrors(error, methods));
    },
  });

  const isDisabled = methods.watch("is_disabled");
  const chronicIllness = methods.watch("chronic_illness");
  const allergies = methods.watch("allergies");
  const medications = methods.watch("medications");
  const dietaryRestrictions = methods.watch("dietary_restrictions");
  const otherHealthIssues = methods.watch("other_health_issues");

  return (
    <Form {...methods}>
      <ProfileFormDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Edit health information"
        description="Maintain accessibility needs, medical conditions and health notes."
        submitLabel="Update health"
        busy={mutation.isPending}
        canSubmit={methods.formState.isDirty && methods.formState.isValid}
        onSubmit={methods.handleSubmit((values) => mutation.mutateAsync(values))}
        contentClassName="max-w-4xl"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SwitchField
            label="Is disabled"
            checked={isDisabled}
            disabled={mutation.isPending}
            error={methods.formState.errors.is_disabled as any}
            onCheckedChange={(checked) =>
              methods.setValue("is_disabled", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <SwitchField
            label="Visual issues"
            checked={methods.watch("visual_issues")}
            disabled={mutation.isPending}
            error={methods.formState.errors.visual_issues as any}
            onCheckedChange={(checked) =>
              methods.setValue("visual_issues", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <SwitchField
            label="Hearing issues"
            checked={methods.watch("hearing_issues")}
            disabled={mutation.isPending}
            error={methods.formState.errors.hearing_issues as any}
            onCheckedChange={(checked) =>
              methods.setValue("hearing_issues", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <SwitchField
            label="Mobility issues"
            checked={methods.watch("mobility_issues")}
            disabled={mutation.isPending}
            error={methods.formState.errors.mobility_issues as any}
            onCheckedChange={(checked) =>
              methods.setValue("mobility_issues", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <SwitchField
            label="Chronic illness"
            checked={chronicIllness}
            disabled={mutation.isPending}
            error={methods.formState.errors.chronic_illness as any}
            onCheckedChange={(checked) =>
              methods.setValue("chronic_illness", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <SwitchField
            label="Allergies"
            checked={allergies}
            disabled={mutation.isPending}
            error={methods.formState.errors.allergies as any}
            onCheckedChange={(checked) =>
              methods.setValue("allergies", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <SwitchField
            label="Medications"
            checked={medications}
            disabled={mutation.isPending}
            error={methods.formState.errors.medications as any}
            onCheckedChange={(checked) =>
              methods.setValue("medications", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <SwitchField
            label="Dietary restrictions"
            checked={dietaryRestrictions}
            disabled={mutation.isPending}
            error={methods.formState.errors.dietary_restrictions as any}
            onCheckedChange={(checked) =>
              methods.setValue("dietary_restrictions", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <SwitchField
            label="Other health issues"
            checked={otherHealthIssues}
            disabled={mutation.isPending}
            error={methods.formState.errors.other_health_issues as any}
            onCheckedChange={(checked) =>
              methods.setValue("other_health_issues", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextareaField
            label="Disability details"
            rows={3}
            disabled={mutation.isPending || !isDisabled}
            {...methods.register("disability_details")}
            error={methods.formState.errors.disability_details as any}
          />

          <TextareaField
            label="Chronic illness details"
            rows={3}
            disabled={mutation.isPending || !chronicIllness}
            {...methods.register("chronic_illness_details")}
            error={methods.formState.errors.chronic_illness_details as any}
          />

          <TextareaField
            label="Allergy details"
            rows={3}
            disabled={mutation.isPending || !allergies}
            {...methods.register("allergy_details")}
            error={methods.formState.errors.allergy_details as any}
          />

          <TextareaField
            label="Medication details"
            rows={3}
            disabled={mutation.isPending || !medications}
            {...methods.register("medication_details")}
            error={methods.formState.errors.medication_details as any}
          />

          <TextareaField
            label="Dietary restriction details"
            rows={3}
            disabled={mutation.isPending || !dietaryRestrictions}
            {...methods.register("dietary_restriction_details")}
            error={methods.formState.errors.dietary_restriction_details as any}
          />

          <TextareaField
            label="Other health issue details"
            rows={3}
            disabled={mutation.isPending || !otherHealthIssues}
            {...methods.register("other_health_issue_details")}
            error={methods.formState.errors.other_health_issue_details as any}
          />
        </div>
      </ProfileFormDialog>
    </Form>
  );
}
