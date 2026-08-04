"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { managementProfileApi } from "../../apis/management-profile.api";
import { useStudentProfileCache } from "../../hooks/use-student-profile-cache";
import {
  guardianSchema,
  type GuardianValues,
} from "../../schema/management-profile.schema";
import type { ManagedGuardian } from "../../types/management-profile.types";
import { applyManagementApiErrors } from "../../utils/management-form-error";
import { ProfileFormDialog } from "./profile-form-dialog";
import { toSentenceCase } from "@/utils/text-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  userId: string;
  guardian: ManagedGuardian | null;
};

export function GuardianEditModal({
  open,
  onOpenChange,
  studentId,
  userId,
  guardian,
}: Props) {
  const cache = useStudentProfileCache(studentId, userId);

  const defaults = useMemo<GuardianValues>(
    () => ({
      relation: guardian?.relation ?? "guardian",
      full_name: guardian?.full_name ?? "",
      phone: guardian?.phone ?? "",
      email: guardian?.email ?? "",
      occupation: guardian?.occupation ?? "",
      is_primary: guardian?.is_primary ?? false,
    }),
    [guardian]
  );

  const methods = useForm<GuardianValues>({
    resolver: zodResolver(guardianSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;
    methods.reset(defaults);
    methods.clearErrors();
  }, [defaults, methods, open]);

  const mutation = useMutation({
    mutationFn: (values: GuardianValues) => {
      if (!guardian?.id) {
        throw new Error("Guardian ID is required for update");
      }

      return managementProfileApi.updateGuardian(userId, guardian.id, values);
    },
    onSuccess: async (updatedGuardian) => {
      cache.setGuardian(updatedGuardian);
      onOpenChange(false);
      toast.success("Guardian updated successfully");
      void cache.refresh();
    },
    onError: (error) => {
      toast.error(applyManagementApiErrors(error, methods));
    },
  });

  return (
    <Form {...methods}>
      <ProfileFormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={`Edit ${toSentenceCase(guardian?.relation ?? "guardian")}'s Name and Contact Info`}
        description={`Update the ${toSentenceCase(guardian?.relation ?? "guardian")}'s name, phone, email, and occupation information.`}
        submitLabel="Update guardian"
        busy={mutation.isPending}
        canSubmit={
          Boolean(guardian?.id) &&
          methods.formState.isDirty &&
          methods.formState.isValid
        }
        onSubmit={methods.handleSubmit((values) => mutation.mutateAsync(values))}
        contentClassName="max-w-2xl"
      >
        <div className="grid gap-4 sm:grid-cols-1">
          <span className="hidden">
            <FormField
              control={methods.control}
              name="relation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Relation <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mutation.isPending}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full">
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      {/* <SelectItem value="brother">Brother</SelectItem>
                    <SelectItem value="sister">Sister</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem> */}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </span>

          <FormField
            control={methods.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Full name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} disabled={mutation.isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={methods.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    placeholder="+97798XXXXXXXX"
                    disabled={mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={methods.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="name@example.com"
                    disabled={mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="hidden">
            <FormField
              control={methods.control}
              name="occupation"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={methods.control}
              name="is_primary"
              render={({ field }) => (
                <FormItem className="flex items-start gap-3 rounded-lg border p-3 sm:col-span-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    disabled={mutation.isPending}
                  />
                  <div className="space-y-1">
                    <FormLabel className="cursor-pointer">Primary guardian</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Use this guardian as the student's primary contact.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
      </ProfileFormDialog>
    </Form>
  );
}
