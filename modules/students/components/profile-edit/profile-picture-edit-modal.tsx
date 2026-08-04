"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ImagePickerField } from "@/components/form/ImagePickerField";
import { Form, FormField } from "@/components/ui/form";

import { managementProfileApi } from "../../apis/management-profile.api";
import { useStudentProfileCache } from "../../hooks/use-student-profile-cache";
import type { ManagedUser } from "../../types/management-profile.types";
import { applyManagementApiErrors } from "../../utils/management-form-error";
import { ProfileFormDialog } from "./profile-form-dialog";

const profilePictureSchema = z.object({
  profile_picture_file: z.string().nullable(),
});

type ProfilePictureValues = z.infer<typeof profilePictureSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  userId: string;
  user: ManagedUser | null;
};

const emptyValues: ProfilePictureValues = {
  profile_picture_file: null,
};

export function ProfilePictureEditModal({
  open,
  onOpenChange,
  studentId,
  userId,
  user,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const cache = useStudentProfileCache(studentId, userId);

  const methods = useForm<ProfilePictureValues>({
    resolver: zodResolver(profilePictureSchema),
    defaultValues: emptyValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;
    methods.reset(emptyValues);
    methods.clearErrors();
    setUploading(false);
  }, [methods, open, user?.profile_picture_file?.id]);

  const mutation = useMutation({
    mutationFn: (values: ProfilePictureValues) =>
      managementProfileApi.updateProfilePicture(userId, {
        profile_picture_file: values.profile_picture_file || null,
      }),
    onSuccess: async (updatedUser) => {
      cache.setUser(updatedUser);
      methods.reset(emptyValues);
      onOpenChange(false);
      toast.success("Profile picture updated successfully");
      void cache.refresh();
    },
    onError: (error) => {
      toast.error(applyManagementApiErrors(error, methods));
    },
  });

  const busy = uploading || mutation.isPending;

  return (
    <Form {...methods}>
      <ProfileFormDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && busy) return;
          if (!nextOpen) methods.reset(emptyValues);
          onOpenChange(nextOpen);
        }}
        title="Change profile picture"
        description="Upload a new picture or remove the current picture, then save the change."
        submitLabel="Update picture"
        busy={busy}
        canSubmit={methods.formState.isDirty}
        onSubmit={methods.handleSubmit((values) => mutation.mutateAsync(values))}
        contentClassName="max-w-lg"
      >
        <FormField
          control={methods.control}
          name="profile_picture_file"
          render={({ field, fieldState }) => (
            <ImagePickerField
              title="Profile picture"
              hint="Select student profile picture"
              initialUri={user?.profile_picture_file?.file_url ?? null}
              value={field.value}
              onChange={(fileId) => {
                field.onChange(fileId);
                methods.trigger("profile_picture_file");
              }}
              error={fieldState.error}
              onUploadStatusChange={setUploading}
              deleteOnRemove={false}
              disabled={mutation.isPending}
            />
          )}
        />
      </ProfileFormDialog>
    </Form>
  );
}
