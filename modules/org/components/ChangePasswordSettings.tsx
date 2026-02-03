"use client";

import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  changePasswordSchema,
  changePasswordDefaults,
  type ChangePasswordValues,
} from "../schema/change-password.schema";
import { changePasswordApi } from "../api/change-password.api";

/**
 * Password field with perfectly aligned toggle icon.
 * We render label/input/hint/error here (instead of InputField)
 * to position the icon relative to the INPUT, not the entire field.
 */
function PasswordField({
  label,
  required,
  placeholder,
  value,
  onChange,
  error,
  show,
  onToggleShow,
  hint,
  autoComplete,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: FieldError;
  show: boolean;
  onToggleShow: () => void;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      {/* label */}
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-medium">
          {label} {required ? <span className="text-destructive">*</span> : null}
        </label>
      </div>

      {/* input wrapper (icon aligns to this) */}
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          className={cn(
            "pr-11", // space for icon button
            error && "border-destructive focus-visible:ring-destructive/30"
          )}
        />

        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "grid h-8 w-8 place-items-center rounded-md",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted/40 transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          )}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* hint / error */}
      {hint && !error?.message ? (
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
          {hint}
        </p>
      ) : null}

      {error?.message ? (
        <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}

export function ChangePasswordSettings() {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const methods = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: changePasswordDefaults,
    mode: "onSubmit",
  });

  const newPasswordValue = methods.watch("new_password");

  const strengthHint = useMemo(() => {
    const v = newPasswordValue || "";
    if (!v) return "Use at least 8 characters. Add numbers and symbols for better security.";
    if (v.length < 8) return "Too short. Use at least 8 characters.";
    if (!/[0-9]/.test(v)) return "Add a number for better security.";
    if (!/[A-Z]/.test(v)) return "Add an uppercase letter for better security.";
    if (!/[^A-Za-z0-9]/.test(v)) return "Add a symbol for better security (e.g. @ # !).";
    return "Strong password";
  }, [newPasswordValue]);

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordValues) => changePasswordApi.change(values),
    onSuccess: (data) => {
      // Toast is already handled by API interceptor
      methods.reset(changePasswordDefaults);
      setShowOld(false);
      setShowNew(false);
      setShowConfirm(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || "Failed to change password";
      toast.error(msg);
    },
  });

  const isBusy = mutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold sm:text-xl">Change Password</h1>
        <p className="text-sm text-muted-foreground">
          Update your password to keep your account secure.
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border bg-card">
        <div className="border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border bg-muted/30">
              <KeyRound size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Password</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Make sure your new password is strong and unique.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <Form {...methods}>
            <form
              className="space-y-4"
              onSubmit={methods.handleSubmit(async (values) => {
                await mutation.mutateAsync(values);
              })}
            >
              <FormField
                control={methods.control}
                name="old_password"
                render={({ field, fieldState }) => (
                  <PasswordField
                    label="Old Password"
                    required
                    placeholder="Enter your old password"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error}
                    show={showOld}
                    onToggleShow={() => setShowOld((v) => !v)}
                    autoComplete="current-password"
                  />
                )}
              />

              <FormField
                control={methods.control}
                name="new_password"
                render={({ field, fieldState }) => (
                  <PasswordField
                    label="New Password"
                    required
                    placeholder="Enter a new password"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error}
                    show={showNew}
                    onToggleShow={() => setShowNew((v) => !v)}
                    hint={strengthHint}
                    autoComplete="new-password"
                  />
                )}
              />

              <FormField
                control={methods.control}
                name="confirm_password"
                render={({ field, fieldState }) => (
                  <PasswordField
                    label="Confirm Password"
                    required
                    placeholder="Re-enter your new password"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error}
                    show={showConfirm}
                    onToggleShow={() => setShowConfirm((v) => !v)}
                    autoComplete="new-password"
                  />
                )}
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => methods.reset(changePasswordDefaults)}
                >
                  Reset
                </Button>

                <Button type="submit" disabled={isBusy}>
                  {isBusy ? "Updating…" : "Update Password"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Tip card */}
      <div className="rounded-2xl border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border bg-card">
            <ShieldCheck size={18} />
          </span>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Good password tips</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Use 8+ characters with numbers and symbols.</li>
              <li>Avoid using your name, email, or common words.</li>
              <li>Don’t reuse passwords across different apps.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordSettings;
