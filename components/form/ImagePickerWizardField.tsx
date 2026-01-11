"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import type { FieldError } from "react-hook-form";
import { api } from "@/lib/http/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Upload,
  Loader2,
  XCircle,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";

type Props = {
  title?: string;
  hint?: string;
  initialUri?: string | null;
  fileType?: "photo" | "attachment" | string;
  isPublic?: boolean;
  value?: string | null;
  onChange: (id: string | null) => void;
  onUploadStatusChange?: (uploading: boolean) => void;
  error?: FieldError;
  showInlinePreview?: boolean;
};

/**
 * Optimized wizard-style image picker with proper React Query integration
 */
export function ImagePickerWizardField({
  title = "Image",
  hint = "Click to select an image",
  initialUri = null,
  fileType = "photo",
  isPublic = false,
  value,
  onChange,
  onUploadStatusChange,
  error,
  showInlinePreview = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUri);
  const [stagedId, setStagedId] = useState<string | null>(value ?? null);

  useEffect(() => {
    setPreviewUrl(initialUri ?? null);
    setStagedId(value ?? null);
    setStep(1);
  }, [initialUri, value]);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post<{ id: string }[]>("/api/v1/files/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
  });

  const uploading = uploadMutation.isPending;

  useEffect(() => {
    onUploadStatusChange?.(uploading);
  }, [uploading, onUploadStatusChange]);

  const hasImage = useMemo(() => Boolean(previewUrl), [previewUrl]);
  const canConfirm = useMemo(
    () => Boolean(stagedId) && Boolean(previewUrl) && !uploading,
    [stagedId, previewUrl, uploading]
  );

  const resetWizard = useCallback(() => {
    setPreviewUrl(initialUri ?? null);
    setStagedId(value ?? null);
    setStep(1);
  }, [initialUri, value]);

  const handlePick = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("file_type", fileType);
        formData.append("is_public", isPublic ? "true" : "false");

        const res = await uploadMutation.mutateAsync(formData);
        const id = res?.[0]?.id ?? null;

        if (!id) throw new Error("Upload failed: missing file ID");

        setStagedId(id);
        toast.success("Image uploaded successfully");
        setStep(2);
      } catch (err: any) {
        console.error(err);
        const detail =
          err?.response?.data?.detail || err?.message || "Unexpected error during upload";

        toast.error("Image upload failed - " + detail);
        setPreviewUrl(initialUri ?? null);
        setStagedId(value ?? null);
        setStep(1);
      } finally {
        e.target.value = "";
      }
    },
    [fileType, isPublic, uploadMutation, initialUri, value]
  );

  const handleClearCommitted = useCallback(() => {
    onChange(null);
    setPreviewUrl(null);
    setStagedId(null);
    toast.info("Image removed");
  }, [onChange]);

  const handleClearStaged = useCallback(() => {
    setPreviewUrl(initialUri ?? null);
    setStagedId(value ?? null);
    setStep(1);
  }, [initialUri, value]);

  const handleConfirm = useCallback(() => {
    if (!stagedId) return;
    onChange(stagedId);
    setOpen(false);
    toast.success("Image selected");
  }, [stagedId, onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{title}</label>
        {uploading && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Uploading…
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
        {showInlinePreview ? (
          <div
            className={cn(
              "grid size-12 place-items-center overflow-hidden rounded-lg border bg-muted/20"
            )}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={22} className="text-muted-foreground" />
            )}
          </div>
        ) : null}

        <div className="flex-1">
          <div className="text-sm font-medium">
            {previewUrl ? "Image selected" : "No image"}
          </div>
          <div className="text-xs text-muted-foreground">{hint}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            {previewUrl ? "Change" : "Select"}
          </Button>

          {previewUrl && (
            <Button type="button" variant="destructive" onClick={handleClearCommitted}>
              Remove
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mt-1 text-xs font-medium text-destructive">{error.message}</p>}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetWizard();
        }}
      >
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{title}</span>
              <span className="text-xs text-muted-foreground">Step {step} of 2</span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 flex items-center gap-2">
            <div
              className={cn(
                "grid size-7 place-items-center rounded-full border text-xs font-semibold",
                step === 1
                  ? "border-primary text-primary"
                  : "border-primary bg-primary text-primary-foreground"
              )}
            >
              1
            </div>
            <div className="text-xs font-medium text-muted-foreground">Upload</div>
            <div className="h-px w-10 bg-border" />
            <div
              className={cn(
                "grid size-7 place-items-center rounded-full border text-xs font-semibold",
                step === 2 ? "border-primary text-primary" : "text-muted-foreground"
              )}
            >
              2
            </div>
            <div className="text-xs font-medium text-muted-foreground">Preview</div>
          </div>

          <div className="mt-4 space-y-4">
            {step === 1 && (
              <div className="rounded-xl border bg-card p-4">
                <div className="mb-2 text-sm font-semibold">Upload an image</div>

                <div className="relative flex min-h-44 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/60 bg-background transition hover:bg-accent/20">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={uploading}
                    onChange={handlePick}
                  />

                  <div className="pointer-events-none flex flex-col items-center justify-center gap-2">
                    <Upload className="text-primary/80" size={42} />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-medium text-foreground/80">
                        Click to select an image
                      </span>
                      <span className="text-[10px] text-muted-foreground">PNG, JPG up to ~5MB</span>
                    </div>
                  </div>
                </div>

                {previewUrl && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs text-muted-foreground">Current preview</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-[280px] w-full rounded-xl border object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="rounded-xl border bg-card p-4">
                <div className="mb-2 text-sm font-semibold">Preview & confirm</div>

                <div className="relative overflow-hidden rounded-xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl ?? ""}
                    alt="Preview"
                    className="w-full max-h-[380px] object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleClearStaged}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-white"
                    disabled={uploading}
                    title="Remove selection"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle size={16} className="text-primary" />
                  Uploaded successfully. Click &quot;Confirm&quot; to use this image.
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (step === 1) {
                  setOpen(false);
                } else {
                  setStep(1);
                }
              }}
              disabled={uploading}
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            <div className="flex items-center gap-2">
              {step === 1 ? (
                <Button type="button" onClick={() => setStep(2)} disabled={!previewUrl || uploading}>
                  Next
                </Button>
              ) : (
                <Button type="button" onClick={handleConfirm} disabled={!canConfirm}>
                  Confirm
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
