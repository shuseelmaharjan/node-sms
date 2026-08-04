"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ImagePickerField } from "@/components/form/ImagePickerField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { profileApi, profileQueryKey } from "../../../api/profile.api";
import type { AccountProfile } from "../../../types/profile.types";
import { getApiErrorMessage } from "../../../utils/api-error";

export function ProfilePictureModal({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AccountProfile;
}) {
  const queryClient = useQueryClient();
  const [pendingFileId, setPendingFileId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  const mutation = useMutation({
    mutationFn: profileApi.updateProfilePicture,
  });

  const busy = uploading || mutation.isPending;

  const resetSelection = () => {
    setPendingFileId(null);
    setPickerKey((value) => value + 1);
  };

  useEffect(() => {
    if (!open) return;
    resetSelection();
    // Reset whenever the modal opens or the server-side image changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profile.profile_picture_file?.id]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && busy) return;
    if (!nextOpen) resetSelection();
    onOpenChange(nextOpen);
  };

  const savePicture = async () => {
    if (!pendingFileId) return;

    try {
      const response = await mutation.mutateAsync({
        profile_picture_file: pendingFileId,
      });

      queryClient.setQueryData<AccountProfile>(profileQueryKey, response.user);
      toast.success(response.message || "Profile picture updated successfully");
      resetSelection();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to update profile picture")
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[calc(100vw-1.5rem)] max-w-[620px] p-4 sm:p-6"
        onPointerDownOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader className="space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-muted/30">
                <Camera className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold sm:text-lg">
                  Change profile picture
                </DialogTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload an image, review the preview, and save it to your account.
                </p>
              </div>
            </div>

          </div>
          <div className="mt-4 border-b" />
        </DialogHeader>

        <div className="pt-2">
          <ImagePickerField
            key={`${profile.profile_picture_file?.id ?? "empty"}-${pickerKey}`}
            title="Profile photo"
            hint="Choose a new profile picture"
            initialUri={profile.profile_picture_file?.file_url ?? null}
            value={pendingFileId}
            onChange={setPendingFileId}
            fileType="image"
            deleteOnRemove={false}
            onUploadStatusChange={setUploading}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {pendingFileId
              ? "The uploaded image is ready to save."
              : "JPG or PNG, up to 5 MB."}
          </p>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy || !pendingFileId}
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
      </DialogContent>
    </Dialog>
  );
}
