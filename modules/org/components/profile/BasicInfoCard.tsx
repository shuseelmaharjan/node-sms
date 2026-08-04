"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { toast } from "sonner";

import { FormWizard } from "@/components/form/FormWizard";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { profileApi, profileQueryKey } from "../../api/profile.api";
import {
  basicInfoSchema,
  phoneToFormValue,
  type BasicInfoValues,
} from "../../schema/profile.schema";
import type { AccountProfile } from "../../types/profile.types";
import {
  applyApiFieldErrors,
  getApiErrorMessage,
} from "../../utils/api-error";

export function BasicInfoCard({ profile }: { profile: AccountProfile }) {
  const queryClient = useQueryClient();

  const defaultValues = useMemo<BasicInfoValues>(
    () => ({
      first_name: profile.first_name ?? "",
      middle_name: profile.middle_name ?? "",
      last_name: profile.last_name ?? "",
      phone: phoneToFormValue(profile.phone),
    }),
    [
      profile.first_name,
      profile.middle_name,
      profile.last_name,
      profile.phone,
    ]
  );

  const mutation = useMutation({
    mutationFn: profileApi.updateBasicInfo,
  });

  return (
    <section className="rounded-2xl border bg-card">
      <CardHeader
        icon={UserRound}
        title="Personal information"
        description="Update the name and phone number used on your account."
      />

      <div className="p-4 sm:p-6">
        <FormWizard
          schema={basicInfoSchema}
          defaultValues={defaultValues}
          resetKey={JSON.stringify(defaultValues)}
          submitLabel="Save personal information"
          submitLoading={mutation.isPending}
          onSubmit={async (values, methods) => {
            methods.clearErrors();

            try {
              const response = await mutation.mutateAsync(values);

              queryClient.setQueryData<AccountProfile>(
                profileQueryKey,
                response.user
              );

              methods.reset(
                {
                  first_name: response.user.first_name,
                  middle_name: response.user.middle_name,
                  last_name: response.user.last_name,
                  phone: phoneToFormValue(response.user.phone),
                },
                { keepDefaultValues: false }
              );
            } catch (error) {
              const hasFieldErrors = applyApiFieldErrors(error, methods, [
                "first_name",
                "middle_name",
                "last_name",
                "phone",
              ]);

              if (!hasFieldErrors) {
                toast.error(
                  getApiErrorMessage(
                    error,
                    "Failed to update personal information"
                  )
                );
              }
            }
          }}
          render={(methods) => (
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
      </div>
    </section>
  );
}

function CardHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-muted/30">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
