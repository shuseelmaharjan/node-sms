"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { NepalAddressFields } from "@/components/address/NepalAddressFields";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { toSentenceCase } from "@/utils/text-utils";

import { managementProfileApi } from "../../apis/management-profile.api";
import { useStudentProfileCache } from "../../hooks/use-student-profile-cache";
import {
  addressSchema,
  type AddressValues,
} from "../../schema/management-profile.schema";
import type {
  ManagedAddress,
  ManagedAddressType,
} from "../../types/management-profile.types";
import { applyManagementApiErrors } from "../../utils/management-form-error";
import { ProfileFormDialog } from "./profile-form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  userId: string;
  addressType: ManagedAddressType;
  address: ManagedAddress | null;
};

export function AddressEditModal({
  open,
  onOpenChange,
  studentId,
  userId,
  addressType,
  address,
}: Props) {
  const cache = useStudentProfileCache(
    studentId,
    userId
  );

  const defaults = useMemo<AddressValues>(
    () => ({
      address: {
        country: address?.country ?? "Nepal",
        province: address?.province ?? "",
        district: address?.district ?? "",
        municipality: address?.municipality ?? "",
        ward_no: address?.ward_no ?? "",
        street: address?.street ?? "",
        tole: address?.tole ?? "",
        house_no: address?.house_no ?? "",
        postal_code: address?.postal_code ?? "",
        is_primary:
          address?.is_primary ??
          addressType === "permanent",
      },
    }),
    [
      address?.country,
      address?.province,
      address?.district,
      address?.municipality,
      address?.ward_no,
      address?.street,
      address?.tole,
      address?.house_no,
      address?.postal_code,
      address?.is_primary,
      addressType,
    ]
  );

  const methods = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;

    methods.reset(defaults, {
      keepDefaultValues: false,
    });

    methods.clearErrors();
  }, [open, defaults, methods]);

  const mutation = useMutation({
    mutationFn: async (
      values: AddressValues
    ) => {
      const payload = {
        country: values.address.country.trim(),
        province: values.address.province.trim(),
        district: values.address.district.trim(),
        municipality:
          values.address.municipality.trim(),
        ward_no: values.address.ward_no.trim(),
        street: values.address.street.trim(),
        tole: values.address.tole.trim(),
        house_no: values.address.house_no.trim(),
        postal_code:
          values.address.postal_code.trim(),
        is_primary: values.address.is_primary,
      };

      return managementProfileApi.updateAddress(
        userId,
        addressType,
        payload
      );
    },

    onSuccess: async (updatedAddress) => {
      cache.setAddress(updatedAddress);

      methods.reset(
        {
          address: {
            country:
              updatedAddress.country ?? "Nepal",
            province:
              updatedAddress.province ?? "",
            district:
              updatedAddress.district ?? "",
            municipality:
              updatedAddress.municipality ?? "",
            ward_no:
              updatedAddress.ward_no ?? "",
            street:
              updatedAddress.street ?? "",
            tole:
              updatedAddress.tole ?? "",
            house_no:
              updatedAddress.house_no ?? "",
            postal_code:
              updatedAddress.postal_code ?? "",
            is_primary:
              updatedAddress.is_primary ?? false,
          },
        },
        {
          keepDefaultValues: false,
        }
      );

      onOpenChange(false);

      toast.success(
        `${toSentenceCase(
          addressType
        )} address updated successfully`
      );

      void cache.refresh();
    },

    onError: (error) => {
      const message = applyManagementApiErrors(
        error,
        methods,
        {
          fieldPrefix: "address",
        }
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
    methods.formState.isDirty &&
    methods.formState.isValid &&
    !mutation.isPending;

  return (
    <Form {...methods}>
      <ProfileFormDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={`${address ? "Edit" : "Add"} ${toSentenceCase(
          addressType
        )} address`}
        description="Update the student's location and contact address details."
        submitLabel={
          address
            ? "Update address"
            : "Save address"
        }
        busy={mutation.isPending}
        canSubmit={canSubmit}
        onSubmit={methods.handleSubmit(
          async (values) => {
            await mutation.mutateAsync(values);
          }
        )}
        contentClassName="max-w-3xl"
      >
        <NepalAddressFields
          title={`${toSentenceCase(addressType)} Address`}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          watch={methods.watch}
          errors={methods.formState.errors}
          disabled={mutation.isPending}
          baseName="address"
          className="grid-cols-1 sm:grid-cols-2 border-none m-0 p-0"
        />

        <span className="hidden">
          <FormField
            control={methods.control}
            name="address.is_primary"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 rounded-lg border p-3">
                <FormControl>
                  <Checkbox
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked === true
                      );
                    }}
                    disabled={mutation.isPending}
                  />
                </FormControl>

                <div className="space-y-1">
                  <FormLabel className="cursor-pointer">
                    Primary address
                  </FormLabel>

                  <p className="text-xs text-muted-foreground">
                    Mark this as the student's
                    primary address.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </span>
      </ProfileFormDialog>
    </Form>
  );
}