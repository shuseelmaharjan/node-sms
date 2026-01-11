"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import type { FieldError } from "react-hook-form";
import axios from "axios";
import { api } from "@/api";
import { Loader2, X, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type UploadResponse = {
  id: string;
  file: string;
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
  initialUri?: string | null;

  value?: string | null;
  onChange: (id: string | null) => void;

  fileType?: string;

  error?: FieldError;
  onUploadStatusChange?: (uploading: boolean) => void;

  deleteOnRemove?: boolean;
};

function extractDrfError(data: any): string | null {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    return String(data.non_field_errors[0]);
  }
  if (typeof data === "object") {
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v) && v.length) return `${k}: ${v[0]}`;
      if (typeof v === "string") return `${k}: ${v}`;
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
  onUploadStatusChange,
  deleteOnRemove = false,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUri);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setPreviewUrl(initialUri ?? null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, [initialUri]);

  const uploadUrl = "/api/v1/files/upload/";

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Debug to confirm FormData has the file
      console.log("UPLOAD FormData entries:");
      for (const [k, v] of formData.entries()) {
        if (v instanceof File) {
          console.log(`- ${k}: File(${v.name}, ${v.type}, ${v.size} bytes)`);
        } else {
          console.log(`- ${k}:`, v);
        }
      }

      // ✅ no headers here. interceptor will handle FormData correctly.
      const res = await api.post<UploadResponse>(uploadUrl, formData);
      return res.data;
    },

    onSuccess: (data) => {
      onChange(data.id);
      setPreviewUrl(data.file);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      toast.success("Image uploaded successfully");
    },

    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        console.error("UPLOAD ERROR status:", err.response?.status);
        console.error("UPLOAD ERROR data:", err.response?.data);
        console.error("UPLOAD REQUEST headers:", err.config?.headers);
      } else {
        console.error("UPLOAD ERROR:", err);
      }

      const msg = axios.isAxiosError(err)
        ? extractDrfError(err.response?.data) || err.message
        : "Upload failed";

      toast.error(msg);
      setPreviewUrl(initialUri ?? null);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/remove-file/${id}/`);
    },
    onError: (err: any) => {
      console.error("DELETE ERROR:", err?.response?.data ?? err);
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

      const localUrl = URL.createObjectURL(file);
      objectUrlRef.current = localUrl;
      setPreviewUrl(localUrl);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_type", fileType);

      try {
        await uploadMutation.mutateAsync(formData);
      } catch {
        // ✅ avoid "Uncaught (in promise)"
      } finally {
        e.target.value = "";
      }
    },
    [uploadMutation, fileType]
  );

  const handleRemove = useCallback(async () => {
    const id = value ?? null;

    onChange(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

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

      {hasImage ? (
        <div className="rounded-xl bg-card">
          <div className="relative overflow-hidden rounded-lg border bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl!}
              alt="Preview"
              className="h-56 w-full object-cover"
            />

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
              <span className="text-xs text-muted-foreground">
                PNG, JPG up to ~5MB
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={(ev) => {
                ev.stopPropagation();
                openPicker();
              }}
            >
              <Upload size={14} className="mr-2" />
              Select Image
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs font-medium text-destructive">
          {error.message}
        </p>
      )}

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
