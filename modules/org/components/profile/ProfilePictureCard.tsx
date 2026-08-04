"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ImagePickerField } from "@/components/form/ImagePickerField";
import { Button } from "@/components/ui/button";

import { profileApi, profileQueryKey } from "../../api/profile.api";
import type { AccountProfile } from "../../types/profile.types";
import { getApiErrorMessage } from "../../utils/api-error";

export function ProfilePictureCard({ profile }: { profile: AccountProfile }) {
  const queryClient = useQueryClient();
  const [pendingFileId, setPendingFileId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  const mutation = useMutation({
    mutationFn: profileApi.updateProfilePicture,
  });

  const resetSelection = () => {
    setPendingFileId(null);
    setPickerKey((value) => value + 1);
  };

  const savePicture = async () => {
    if (!pendingFileId) return;

    try {
      const response = await mutation.mutateAsync({
        profile_picture_file: pendingFileId,
      });

      queryClient.setQueryData<AccountProfile>(
        profileQueryKey,
        response.user
      );
      resetSelection();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to update profile picture")
      );
    }
  };

  const blocked = uploading || mutation.isPending;

  return (
    <section className="rounded-2xl border bg-card">
      <div className="border-b px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-muted/30">
            <Camera className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-medium">Profile picture</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Upload the image first, then save it as your profile picture.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <ImagePickerField
          key={`${profile.profile_picture_file?.id ?? "empty"}-${pickerKey}`}
          title="Photo"
          hint="Choose a profile picture"
          initialUri={profile.profile_picture_file?.file_url ?? null}
          value={pendingFileId}
          onChange={setPendingFileId}
          fileType="image"
          deleteOnRemove={false}
          onUploadStatusChange={setUploading}
        />

        <div className="mt-6 flex items-center justify-between gap-3 border-t pt-4">
          <div className="text-xs text-muted-foreground">
            {pendingFileId ? (
              <span className="font-medium text-amber-600 dark:text-amber-400">
                New photo uploaded but not saved
              </span>
            ) : (
              <span>JPG or PNG, up to 5 MB.</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={blocked || !pendingFileId}
              onClick={resetSelection}
            >
              Reset
            </Button>
            <Button
              type="button"
              disabled={blocked || !pendingFileId}
              onClick={() => void savePicture()}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save photo"
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
