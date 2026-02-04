"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { toast } from "sonner";

import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  forgotPasswordSchema,
  forgotPasswordDefaults,
  verifyOtpSchema,
  verifyOtpDefaults,
  resetPasswordSchema,
  resetPasswordDefaults,
  initialResetState,
  type ForgotPasswordValues,
  type VerifyOtpValues,
  type ResetPasswordValues,
  type ResetPasswordState,
} from "../schema/reset-password.schema";
import { resetPasswordApi } from "../api/reset-password.api";

/** Minimal password input with show/hide */
function PasswordInput({
  label,
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: FieldError;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(error && "border-destructive focus-visible:ring-destructive/30", "pr-20")}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error?.message ? (
        <p className="text-xs font-medium text-destructive">{error.message}</p>
      ) : null}
    </div>
  );
}

export function ResetPasswordSettings() {
  const [state, setState] = useState<ResetPasswordState>(initialResetState);

  // Step 1
  const forgotForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: forgotPasswordDefaults,
    mode: "onSubmit",
  });

  // Step 2
  const verifyForm = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: verifyOtpDefaults,
    mode: "onSubmit",
  });

  // Step 3
  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: resetPasswordDefaults,
    mode: "onSubmit",
  });

  const sendOtpMutation = useMutation({
    mutationFn: (values: ForgotPasswordValues) => resetPasswordApi.sendOtp(values),
    onSuccess: (_data, variables) => {
      setState((prev) => ({ ...prev, step: 2, email: variables.email }));
      verifyForm.setValue("email", variables.email);
      toast.success("OTP sent. Please check your email.");
    },
    onError: (err: any) => {
      console.error("Send OTP error:", err);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (values: VerifyOtpValues) => resetPasswordApi.verifyOtp(values),
    onSuccess: (data, variables) => {
      setState((prev) => ({
        ...prev,
        step: 3,
        resetToken: data.reset_token,
        resetTokenExpiresAt: data.reset_token_expires_at,
      }));
      resetForm.setValue("email", variables.email);
      resetForm.setValue("reset_token", data.reset_token);
      toast.success("OTP verified. Set a new password.");
    },
    onError: (err: any) => {
      console.error("Verify OTP error:", err);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetPasswordValues) => resetPasswordApi.resetPassword(values),
    onSuccess: () => {
      setState(initialResetState);
      forgotForm.reset(forgotPasswordDefaults);
      verifyForm.reset(verifyOtpDefaults);
      resetForm.reset(resetPasswordDefaults);
      toast.success("Password reset successfully.");
    },
    onError: (err: any) => {
      console.error("Reset password error:", err);
    },
  });

  const goBack = () => {
    if (state.step === 2) setState((prev) => ({ ...prev, step: 1 }));
    if (state.step === 3) setState((prev) => ({ ...prev, step: 2 }));
  };

  const startOver = () => {
    setState(initialResetState);
    forgotForm.reset(forgotPasswordDefaults);
    verifyForm.reset(verifyOtpDefaults);
    resetForm.reset(resetPasswordDefaults);
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          {state.step === 1 && "Enter your email to receive an OTP."}
          {state.step === 2 && "Enter the OTP sent to your email."}
          {state.step === 3 && "Create a new password."}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
        {/* Top actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Step {state.step} / 3</p>

          <div className="flex gap-2">
            {state.step > 1 ? (
              <Button type="button" variant="outline" size="sm" onClick={goBack}>
                Back
              </Button>
            ) : null}

            <Button type="button" variant="ghost" size="sm" onClick={startOver}>
              Start over
            </Button>
          </div>
        </div>

        {/* Step 1 */}
        {state.step === 1 && (
          <Form {...forgotForm}>
            <form
              className="space-y-4"
              onSubmit={forgotForm.handleSubmit(async (values) => {
                await sendOtpMutation.mutateAsync(values);
              })}
            >
              <FormField
                control={forgotForm.control}
                name="email"
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      {...field}
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      className={cn(
                        fieldState.error &&
                          "border-destructive focus-visible:ring-destructive/30"
                      )}
                    />
                    {fieldState.error?.message ? (
                      <p className="text-xs font-medium text-destructive">
                        {fieldState.error.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />

              <Button type="submit" className="w-full" disabled={sendOtpMutation.isPending}>
                {sendOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          </Form>
        )}

        {/* Step 2 */}
        {state.step === 2 && (
          <Form {...verifyForm}>
            <form
              className="space-y-4"
              onSubmit={verifyForm.handleSubmit(async (values) => {
                await verifyOtpMutation.mutateAsync(values);
              })}
            >
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input value={state.email} disabled className="bg-muted" />
              </div>

              <FormField
                control={verifyForm.control}
                name="otp"
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">OTP</label>
                    <Input
                      {...field}
                      inputMode="numeric"
                      placeholder="6-digit code"
                      maxLength={6}
                      className={cn(
                        "text-center tracking-widest font-mono",
                        fieldState.error &&
                          "border-destructive focus-visible:ring-destructive/30"
                      )}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                    />
                    {fieldState.error?.message ? (
                      <p className="text-xs font-medium text-destructive">
                        {fieldState.error.message}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Check spam/junk if you don’t see it.
                      </p>
                    )}
                  </div>
                )}
              />

              <Button type="submit" className="w-full" disabled={verifyOtpMutation.isPending}>
                {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          </Form>
        )}

        {/* Step 3 */}
        {state.step === 3 && (
          <Form {...resetForm}>
            <form
              className="space-y-4"
              onSubmit={resetForm.handleSubmit(async (values) => {
                await resetPasswordMutation.mutateAsync(values);
              })}
            >
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input value={state.email} disabled className="bg-muted" />
              </div>

              <FormField
                control={resetForm.control}
                name="new_password"
                render={({ field, fieldState }) => (
                  <PasswordInput
                    label="New password"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                )}
              />

              <FormField
                control={resetForm.control}
                name="confirm_password"
                render={({ field, fieldState }) => (
                  <PasswordInput
                    label="Confirm password"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />
                )}
              />

              <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset password"}
              </Button>

              {state.resetTokenExpiresAt ? (
                <p className="text-xs text-muted-foreground">
                  Token expires:{" "}
                  {new Date(state.resetTokenExpiresAt).toLocaleString()}
                </p>
              ) : null}
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordSettings;
