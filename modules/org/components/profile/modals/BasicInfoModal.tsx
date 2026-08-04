"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CrudFormModal } from "@/components/crud/CrudFormModal";
import type { CrudApi } from "@/components/crud/types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { profileApi, profileQueryKey } from "../../../api/profile.api";
import {
  basicInfoSchema,
  phoneToFormValue,
  type BasicInfoValues,
} from "../../../schema/profile.schema";
import type { AccountProfile } from "../../../types/profile.types";
import {
  applyApiFieldErrors,
  getApiErrorMessage,
} from "../../../utils/api-error";

function toDefaults(profile: AccountProfile): BasicInfoValues {
  return {
    first_name: profile.first_name ?? "",
    middle_name: profile.middle_name ?? "",
    last_name: profile.last_name ?? "",
    phone: phoneToFormValue(profile.phone),
  };
}

export function BasicInfoModal({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AccountProfile;
}) {
  const queryClient = useQueryClient();

  const crudApi = useMemo<
    CrudApi<typeof basicInfoSchema, AccountProfile>
  >(
    () => ({
      getById: async () => profileApi.getMe(),
      create: async (values) => {
        const response = await profileApi.updateBasicInfo(values);
        return response.user;
      },
      update: async (_id, values) => {
        const response = await profileApi.updateBasicInfo(values);
        return response.user;
      },
      remove: async () => {
        throw new Error("Profile deletion is not supported from this modal.");
      },
      toDefaults,
    }),
    []
  );

  return (
    <CrudFormModal
      open={open}
      onOpenChange={onOpenChange}
      id={profile.id}
      titleEdit="Edit personal information"
      schema={basicInfoSchema}
      createDefaults={toDefaults(profile)}
      api={crudApi}
      canDelete={false}
      submitLabelUpdate="Save changes"
      contentClassName="md:w-[620px] md:max-w-[620px]"
      onSuccess={(updatedProfile) => {
        queryClient.setQueryData<AccountProfile>(
          profileQueryKey,
          updatedProfile
        );
        toast.success("Personal information updated successfully");
      }}
      onSaveError={(error, methods) => {
        const hasFieldErrors = applyApiFieldErrors(error, methods, [
          "first_name",
          "middle_name",
          "last_name",
          "phone",
        ]);

        if (!hasFieldErrors) {
          toast.error(
            getApiErrorMessage(error, "Failed to update personal information")
          );
        }
      }}
      renderSections={(methods) => (
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
                  <Input
                    {...field}
                    placeholder="Enter first name"
                    autoComplete="given-name"
                  />
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
                  <Input
                    {...field}
                    placeholder="Enter middle name"
                    autoComplete="additional-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={methods.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Last name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter last name"
                    autoComplete="family-name"
                  />
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
                <FormLabel>
                  Phone number <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted/40 px-3 text-sm text-muted-foreground">
                      +977
                    </span>
                    <Input
                      {...field}
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="98XXXXXXXX"
                      autoComplete="tel-national"
                      className="rounded-l-none"
                      onChange={(event) =>
                        field.onChange(
                          event.target.value.replace(/\D/g, "").slice(0, 10)
                        )
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    />
  );
}
