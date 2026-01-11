"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import type { FieldError } from "react-hook-form";
import { api } from "@/lib/http/client";
import { Loader2, X, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type UploadResponse = {
  id: string;
  file: string; // URL from backend/media
  file_type: string;
  original_name: string;
  size_bytes: number;
  is_temporary: boolean;
  meta: any;
  uploaded_at: string;
};

type Props = {
  title?: string;
  hint?: string;

  /** existing image URL for edit mode preview */
  initialUri?: string | null;

  /** RHF value: uploaded file UUID */
  value?: string | null;
  onChange: (id: string | null) => void;

  /** "image" by default (maps to serializer's file_type field) */
  fileType?: string;

  /** If true uses temp-upload, else permanent upload */
  temporary?: boolean;

  /** Optional metadata; will be JSON-stringified */
  meta?: Record<string, any> | null;

  error?: FieldError;
  onUploadStatusChange?: (uploading: boolean) => void;

  /** Optional: call backend delete on remove */
  deleteOnRemove?: boolean;
};

export function ImagePickerField({
  title = "Image",
  hint = "Click to upload an image",
  initialUri = null,
  value,
  onChange,
  fileType = "image",
  temporary = true,
  meta = null,
  error,
  onUploadStatusChange,
  deleteOnRemove = false,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUri);
  const inputRef = useRef<HTMLInputElement>(null);

  // keep preview in sync when switching records
  useEffect(() => {
    setPreviewUrl(initialUri ?? null);
  }, [initialUri]);

  const uploadUrl = temporary
    ? "/api/v1/files/temp-upload/"
    : "/api/v1/files/upload/";

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // IMPORTANT: do NOT set Content-Type manually (axios sets boundary)
      const res = await api.post<UploadResponse>(uploadUrl, formData);
      return res.data;
    },
    onSuccess: (data) => {
      onChange(data.id);
      setPreviewUrl(data.file);
      toast.success("Image uploaded successfully");
    },
    onError: (err: any) => {
      console.error("UPLOAD ERROR:", err?.response?.data);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        // DRF field errors like { file: ["..."] }
        (typeof err?.response?.data === "object"
          ? JSON.stringify(err.response.data)
          : null) ||
        err?.message ||
        "Upload failed";

      toast.error("Image upload failed - " + detail);
      setPreviewUrl(initialUri ?? null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/remove-file/${id}/`);
    },
    onError: (err: any) => {
      console.error("DELETE ERROR:", err?.response?.data);
      toast.error("Failed to delete image from server");
    },
  });

  const uploading = uploadMutation.isPending;
  const deleting = deleteMutation.isPending;

  useEffect(() => {
    onUploadStatusChange?.(uploading || deleting);
  }, [uploading, deleting, onUploadStatusChange]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // immediate local preview
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_type", fileType);

      // meta is optional; DRF JSONField often accepts stringified json in multipart
      if (meta !== null && meta !== undefined) {
        formData.append("meta", JSON.stringify(meta));
      }

      try {
        await uploadMutation.mutateAsync(formData);
      } finally {
        e.target.value = "";
      }
    },
    [uploadMutation, fileType, meta]
  );

  const handleRemove = useCallback(async () => {
    const id = value ?? null;

    // Optimistic UI
    onChange(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
    toast.info("Image removed");

    if (deleteOnRemove && id) {
      await deleteMutation.mutateAsync(id);
    }
  }, [value, onChange, deleteOnRemove, deleteMutation]);

  const openPicker = () => {
    if (!uploading && !deleting) inputRef.current?.click();
  };

  const busy = uploading || deleting;
  const hasImage = Boolean(previewUrl);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{title}</label>
        {busy && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            {uploading ? "Uploading…" : "Removing…"}
          </span>
        )}
      </div>

      {/* Has image => preview + remove only */}
      {hasImage ? (
        <div className="rounded-xl bg-card">
          <div className="relative overflow-hidden rounded-lg border bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl!} alt="Preview" className="h-56 w-full object-cover" />

            {!busy && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-white shadow-lg transition hover:bg-destructive/90"
                title="Remove image"
              >
                <X size={16} />
              </button>
            )}

            {busy && (
              <div className="absolute inset-0 grid place-items-center bg-background/40">
                <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  Working…
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* No image => upload area */
        <div className="rounded-xl border bg-card">
          <div
            onClick={openPicker}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-primary/60 bg-background py-8 transition hover:bg-accent/20"
          >
            <div className="rounded-full bg-primary/10 p-3">
              <ImageIcon size={32} className="text-primary" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-medium">{hint}</span>
              <span className="text-xs text-muted-foreground">PNG, JPG up to ~5MB</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                openPicker();
              }}
            >
              <Upload size={14} className="mr-2" />
              Select Image
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs font-medium text-destructive">{error.message}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={busy}
        onChange={handleFileSelect}
      />
    </div>
  );
}
