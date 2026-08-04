"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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

import { managementProfileApi } from "../../apis/management-profile.api";
import { useStudentProfileCache } from "../../hooks/use-student-profile-cache";
import {
  identitySchema,
  type IdentityValues,
} from "../../schema/management-profile.schema";
import type { ManagedUser } from "../../types/management-profile.types";
import { applyManagementApiErrors } from "../../utils/management-form-error";
import { ProfileFormDialog } from "./profile-form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  userId: string;
  user: ManagedUser | null;
};

export function IdentityEditModal({
  open,
  onOpenChange,
  studentId,
  userId,
  user,
}: Props) {
  const cache = useStudentProfileCache(studentId, userId);

  const defaults = useMemo<IdentityValues>(
    () => ({
      first_name: user?.first_name ?? "",
      middle_name: user?.middle_name ?? "",
      last_name: user?.last_name ?? "",
    }),
    [user]
  );

  const methods = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;
    methods.reset(defaults);
    methods.clearErrors();
  }, [defaults, methods, open]);

  const mutation = useMutation({
    mutationFn: (values: IdentityValues) =>
      managementProfileApi.updateIdentity(userId, values),
    onSuccess: async (updatedUser) => {
      cache.setUser(updatedUser);
      onOpenChange(false);
      toast.success("Student name updated successfully");
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
        title="Edit student name"
        description="Update the student's legal or preferred account name."
        submitLabel="Update name"
        busy={mutation.isPending}
        canSubmit={methods.formState.isDirty && methods.formState.isValid}
        onSubmit={methods.handleSubmit((values) => mutation.mutateAsync(values))}
        contentClassName="max-w-xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={methods.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  First name <span className="text-destructive">*</span>
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
            name="middle_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Middle name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={mutation.isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={methods.control}
            name="last_name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>
                  Last name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} disabled={mutation.isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </ProfileFormDialog>
    </Form>
  );
}
