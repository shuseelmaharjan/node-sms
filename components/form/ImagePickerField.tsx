"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import type { FieldError } from "react-hook-form";
import axios from "axios";
import { api } from "@/api";
import { useAuthStore } from "@/lib/auth/store";
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
  fileType = "photo",
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

  // ✅ BACKEND PATHS
  const uploadUrl = "/api/v1/files/upload/";
  const deleteUrl = (id: string) => `/api/v1/files/${id}/delete/`;

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Debug FormData contents
      console.log('FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      console.log('Sending request to:', uploadUrl);
      
      // Get auth token from store
      const accessToken = useAuthStore.getState().accessToken;
      console.log('Access token:', accessToken ? 'Present' : 'Missing');
      
      // ✅ Create completely clean axios instance to avoid any transformations
      const cleanAxios = axios.create({
        baseURL: api.defaults.baseURL,
        withCredentials: true,
        // Don't set any default headers that might interfere
      });
      
      const res = await cleanAxios.post<UploadResponse>(uploadUrl, formData, {
        headers: {
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
          'X-Client-Type': 'web',
          // Explicitly let browser handle multipart boundary
        },
        // Prevent axios from transforming FormData
        transformRequest: [(data) => data],
      });
      
      console.log('Upload response:', res);
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
      const msg = axios.isAxiosError(err)
        ? extractDrfError(err.response?.data) || err.message
        : "Upload failed";

      if (axios.isAxiosError(err)) {
        console.error("UPLOAD ERROR status:", err.response?.status);
        console.error("UPLOAD ERROR data:", err.response?.data);
        console.error("UPLOAD REQUEST headers:", err.config?.headers);
      } else {
        console.error("UPLOAD ERROR:", err);
      }

      toast.error(msg);

      setPreviewUrl(initialUri ?? null);
      onChange(null);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(deleteUrl(id));
    },
    onError: (err: any) => {
      console.error("DELETE ERROR:", err?.response?.data ?? err);
      toast.error("Failed to delete image from server");
    },
  });

  const uploading = uploadMutation.isPending;
  const deleting = deleteMutation.isPending;
  const busy = uploading || deleting;

  useEffect(() => {
    onUploadStatusChange?.(busy);
  }, [busy, onUploadStatusChange]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        console.log('No file selected');
        return;
      }

      console.log('File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }

      // Local preview immediately
      const localUrl = URL.createObjectURL(file);

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = localUrl;

      setPreviewUrl(localUrl);

      // Create FormData with proper field names
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('file_type', fileType);

      console.log('Created FormData with:', {
        file: file,
        file_type: fileType,
        fileName: file.name
      });

      // Debug: Try to understand what the backend expects
      console.log('About to send to endpoint:', uploadUrl);
      console.log('FormData size:', formData.get('file') || 'unknown');

      try {
        await uploadMutation.mutateAsync(formData);
      } catch (error) {
        console.error('Upload failed:', error);
        // avoid "Uncaught (in promise)"
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
      try {
        await deleteMutation.mutateAsync(id);
      } catch {
        // handled by mutation onError
      }
    }
  }, [value, onChange, deleteOnRemove, deleteMutation]);

  const openPicker = () => {
    if (!busy) inputRef.current?.click();
  };

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
