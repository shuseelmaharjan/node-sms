// components/form/ImagePickerField.tsx
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { useMutation } from "@tanstack/react-query";
import type { FieldError } from "react-hook-form";
import axios from "axios";
import {
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/auth/store";

type UploadResponse = {
  id: string;
  file_url: string;
  download_url?: string | null;
  file_type: string;
  original_name: string;
  size_bytes: number;
  is_temporary: boolean;
  meta: Record<string, unknown>;
  uploaded_at: string;

  /**
   * Backward compatibility for environments returning `file`
   * instead of `file_url`.
   */
  file?: string;
};

type ImagePickerFieldProps = {
  title?: string;
  hint?: string;

  /**
   * Existing image URL received from the profile API.
   */
  initialUri?: string | null;

  required?: boolean;

  /**
   * Controlled file ID.
   *
   * null / undefined:
   * No pending selection; display initialUri.
   *
   * "":
   * User explicitly removed the image.
   *
   * non-empty string:
   * Existing or newly uploaded file ID.
   */
  value?: string | null;

  onChange: (fileId: string | null) => void;

  fileType?: string;
  error?: FieldError;

  onUploadStatusChange?: (busy: boolean) => void;

  /**
   * When true, removing an image also calls the file-delete API.
   *
   * For profile pictures, normally keep this false. Save the null
   * profile_picture_file through the profile-picture PATCH endpoint.
   */
  deleteOnRemove?: boolean;

  /**
   * Maximum image size in bytes.
   * Defaults to 5 MB.
   */
  maxSizeBytes?: number;

  disabled?: boolean;
};

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

function extractDrfError(data: unknown): string | null {
  if (!data) return null;

  if (typeof data === "string") {
    return data;
  }

  if (typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;

  if (typeof record.detail === "string") {
    return record.detail;
  }

  if (typeof record.message === "string") {
    return record.message;
  }

  if (
    Array.isArray(record.non_field_errors) &&
    record.non_field_errors.length > 0
  ) {
    return String(record.non_field_errors[0]);
  }

  for (const [field, fieldError] of Object.entries(record)) {
    if (Array.isArray(fieldError) && fieldError.length > 0) {
      return `${field}: ${String(fieldError[0])}`;
    }

    if (typeof fieldError === "string") {
      return `${field}: ${fieldError}`;
    }
  }

  return null;
}

export function ImagePickerField({
  title = "Image",
  hint = "Click to upload an image",
  initialUri = null,
  value,
  onChange,
  fileType = "image",
  error,
  required = false,
  onUploadStatusChange,
  deleteOnRemove = false,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  disabled = false,
}: ImagePickerFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialUri
  );

  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Temporary browser object URL used while upload is in progress.
   */
  const objectUrlRef = useRef<string | null>(null);

  /**
   * Stores the latest uploaded file and URL.
   *
   * This prevents the synchronization effect from replacing the new
   * image with the old initialUri when onChange(data.id) runs.
   */
  const uploadedFileIdRef = useRef<string | null>(null);
  const uploadedFileUrlRef = useRef<string | null>(null);

  /**
   * Used to detect whether initialUri itself changed after the profile
   * query/cache was updated.
   */
  const previousInitialUriRef = useRef<string | null>(
    initialUri
  );

  /**
   * Preview to restore when an upload fails.
   */
  const previewBeforeUploadRef = useRef<string | null>(
    initialUri
  );

  const uploadUrl = "/api/v1/files/upload/";

  const deleteUrl = (id: string) =>
    `/api/v1/files/${id}/delete/`;

  const releaseObjectUrl = useCallback(() => {
    if (!objectUrlRef.current) return;

    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }, []);

  /**
   * Synchronize local preview with external form and profile state.
   */
  useEffect(() => {
    const initialUriChanged =
      previousInitialUriRef.current !== initialUri;

    previousInitialUriRef.current = initialUri;

    /**
     * Explicitly removed by the user.
     */
    if (value === "") {
      releaseObjectUrl();
      setPreviewUrl(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    /**
     * No pending file selection.
     *
     * This is the initial-load and form-reset state.
     */
    if (value == null) {
      releaseObjectUrl();

      uploadedFileIdRef.current = null;
      uploadedFileUrlRef.current = null;

      setPreviewUrl(initialUri ?? null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    /**
     * Current value belongs to the file uploaded by this component.
     *
     * Do not restore the old initialUri when value changes after upload.
     */
    if (value === uploadedFileIdRef.current) {
      /**
       * After the profile-picture PATCH succeeds, the profile query may
       * return a new authoritative URL. Use it when initialUri changes.
       */
      if (initialUriChanged && initialUri) {
        uploadedFileUrlRef.current = initialUri;
        setPreviewUrl(initialUri);
        return;
      }

      setPreviewUrl(uploadedFileUrlRef.current);
      return;
    }

    /**
     * The controlled value changed externally.
     *
     * Example:
     * - Form reset
     * - Switching records
     * - Parent loaded another profile
     */
    releaseObjectUrl();

    uploadedFileIdRef.current = null;
    uploadedFileUrlRef.current = null;

    setPreviewUrl(initialUri ?? null);
  }, [initialUri, value, releaseObjectUrl]);

  /**
   * Revoke temporary browser URLs when the component unmounts.
   */
  useEffect(() => {
    return () => {
      releaseObjectUrl();
    };
  }, [releaseObjectUrl]);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const accessToken =
        useAuthStore.getState().accessToken;

      /**
       * A clean Axios client avoids JSON transformations applied by the
       * main API instance.
       */
      const uploadClient = axios.create({
        baseURL: api.defaults.baseURL,
        withCredentials: true,
      });

      const response =
        await uploadClient.post<UploadResponse>(
          uploadUrl,
          formData,
          {
            headers: {
              ...(accessToken
                ? {
                    Authorization: `Bearer ${accessToken}`,
                  }
                : {}),
              "X-Client-Type": "web",
            },

            /**
             * Do not manually set Content-Type.
             * The browser must generate the multipart boundary.
             */
            transformRequest: [(requestData) => requestData],
          }
        );

      return response.data;
    },

    onSuccess: (data) => {
      const uploadedUrl =
        data.file_url ?? data.file ?? null;

      if (!uploadedUrl) {
        releaseObjectUrl();
        setPreviewUrl(previewBeforeUploadRef.current);

        toast.error(
          "The image was uploaded, but no image URL was returned"
        );

        return;
      }

      releaseObjectUrl();

      /**
       * Save both values before calling onChange.
       *
       * onChange triggers the synchronization effect. These refs ensure
       * that effect recognizes the new value as the current upload.
       */
      uploadedFileIdRef.current = data.id;
      uploadedFileUrlRef.current = uploadedUrl;

      setPreviewUrl(uploadedUrl);
      onChange(data.id);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      toast.success("Image uploaded successfully");
    },

    onError: (uploadError: unknown) => {
      const message = axios.isAxiosError(uploadError)
        ? extractDrfError(uploadError.response?.data) ||
          uploadError.message
        : "Image upload failed";

      releaseObjectUrl();

      /**
       * Restore the preview that existed before selecting the failed file.
       * Do not clear the form value because upload success never occurred.
       */
      setPreviewUrl(previewBeforeUploadRef.current);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await api.delete(deleteUrl(fileId));
    },
  });

  const uploading = uploadMutation.isPending;
  const deleting = deleteMutation.isPending;

  const busy = uploading || deleting;
  const interactionBlocked = busy || disabled;

  useEffect(() => {
    onUploadStatusChange?.(busy);
  }, [busy, onUploadStatusChange]);

  const handleFileSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];

      if (!selectedFile) return;

      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        event.target.value = "";
        return;
      }

      if (selectedFile.size > maxSizeBytes) {
        const maxSizeMb = Math.round(
          maxSizeBytes / (1024 * 1024)
        );

        toast.error(
          `Image size must be less than ${maxSizeMb} MB`
        );

        event.target.value = "";
        return;
      }

      /**
       * Store the current preview so it can be restored if upload fails.
       */
      previewBeforeUploadRef.current = previewUrl;

      releaseObjectUrl();

      const localPreviewUrl =
        URL.createObjectURL(selectedFile);

      objectUrlRef.current = localPreviewUrl;

      /**
       * Show a local preview immediately while uploading.
       */
      setPreviewUrl(localPreviewUrl);

      const formData = new FormData();

      formData.append(
        "file",
        selectedFile,
        selectedFile.name
      );
      formData.append("file_type", fileType);
      formData.append("is_temporary", "false");

      try {
        await uploadMutation.mutateAsync(formData);
      } catch {
        /**
         * The mutation onError handler displays the message and restores
         * the previous preview.
         */
      } finally {
        event.target.value = "";
      }
    },
    [
      fileType,
      maxSizeBytes,
      previewUrl,
      releaseObjectUrl,
      uploadMutation,
    ]
  );

  const handleRemove = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (interactionBlocked) return;

      const previousPreview = previewUrl;

      const currentFileId =
        typeof value === "string" && value.length > 0
          ? value
          : null;

      /**
       * Optimistically move the component to an explicitly removed state.
       */
      releaseObjectUrl();

      setPreviewUrl(null);
      onChange("");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      /**
       * Usually false for profile pictures because the profile-picture
       * PATCH should remove the relationship first.
       */
      if (!deleteOnRemove || !currentFileId) {
        toast.info("Image removed");
        return;
      }

      try {
        await deleteMutation.mutateAsync(currentFileId);

        uploadedFileIdRef.current = null;
        uploadedFileUrlRef.current = null;

        toast.success("Image removed successfully");
      } catch (deleteError) {
        /**
         * Roll back the UI and controlled value when server deletion fails.
         */
        if (
          currentFileId === uploadedFileIdRef.current
        ) {
          uploadedFileUrlRef.current = previousPreview;
        }

        setPreviewUrl(previousPreview);
        onChange(currentFileId);

        const message = axios.isAxiosError(deleteError)
          ? extractDrfError(deleteError.response?.data) ||
            deleteError.message
          : "Failed to remove image";

        toast.error(message);
      }
    },
    [
      interactionBlocked,
      previewUrl,
      value,
      onChange,
      releaseObjectUrl,
      deleteOnRemove,
      deleteMutation,
    ]
  );

  const openPicker = useCallback(() => {
    if (interactionBlocked) return;

    inputRef.current?.click();
  }, [interactionBlocked]);

  const hasImage = Boolean(previewUrl);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        {title ? (
          <Label className="text-sm font-medium">
            {title}

            {required ? (
              <span className="text-destructive">
                {" "}
                *
              </span>
            ) : null}
          </Label>
        ) : null}

        {busy ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2
              className="h-3.5 w-3.5 animate-spin"
              aria-hidden="true"
            />

            {uploading
              ? "Uploading…"
              : "Removing…"}
          </span>
        ) : null}
      </div>

      {hasImage ? (
        <div className="rounded-xl bg-card">
          <div className="relative overflow-hidden rounded-lg border bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl!}
              alt="Selected image preview"
              className="h-56 w-full object-cover"
              onError={() => {
                toast.error(
                  "The selected image could not be displayed"
                );
              }}
            />

            {!interactionBlocked ? (
              <button
                type="button"
                onClick={handleRemove}
                aria-label="Remove image"
                title="Remove image"
                className={[
                  "absolute right-2 top-2 z-10",
                  "grid h-8 w-8 place-items-center",
                  "cursor-pointer rounded-full",
                  "bg-destructive text-white shadow-lg",
                  "transition-colors",
                  "hover:bg-destructive/90",
                  "focus-visible:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-destructive/40",
                  "focus-visible:ring-offset-2",
                ].join(" ")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            {interactionBlocked ? (
              <div className="absolute inset-0 grid place-items-center bg-background/50 backdrop-blur-[1px]">
                {busy ? (
                  <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />

                    {uploading
                      ? "Uploading image…"
                      : "Removing image…"}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-card">
          <div
            role="button"
            tabIndex={interactionBlocked ? -1 : 0}
            aria-disabled={interactionBlocked}
            onClick={openPicker}
            onKeyDown={(event) => {
              if (interactionBlocked) return;

              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                openPicker();
              }
            }}
            className={[
              "flex flex-col items-center justify-center gap-3",
              "rounded-lg border-2 border-dashed py-8",
              "transition-colors",
              interactionBlocked
                ? "cursor-not-allowed border-muted bg-muted/20 opacity-60"
                : "cursor-pointer border-primary/60 bg-background hover:bg-accent/20",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-ring/40",
            ].join(" ")}
          >
            <div className="rounded-full bg-primary/10 p-3">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>

            <div className="flex flex-col items-center gap-1 px-4 text-center">
              <span className="text-sm font-medium">
                {hint}
              </span>

              <span className="text-xs text-muted-foreground">
                PNG, JPG or WebP, maximum{" "}
                {Math.round(
                  maxSizeBytes / (1024 * 1024)
                )}{" "}
                MB
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={interactionBlocked}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openPicker();
              }}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}

              Select image
            </Button>
          </div>
        </div>
      )}

      {error?.message ? (
        <p className="text-xs font-medium text-destructive">
          {error.message}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        disabled={interactionBlocked}
        onChange={handleFileSelect}
      />
    </div>
  );
}

export default ImagePickerField;