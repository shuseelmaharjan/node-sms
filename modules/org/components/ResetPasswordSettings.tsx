"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Shield, 
  Key, 
  ArrowLeft, 
  CheckCircle2,
  Clock
} from "lucide-react";
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

/**
 * Password field component (reused from change password)
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
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-medium">
          {label} {required ? <span className="text-destructive">*</span> : null}
        </label>
      </div>

      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          className={cn(
            "pr-11",
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

export function ResetPasswordSettings() {
  const [state, setState] = useState<ResetPasswordState>(initialResetState);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Send OTP Form
  const forgotForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: forgotPasswordDefaults,
    mode: "onSubmit",
  });

  // Step 2: Verify OTP Form
  const verifyForm = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: verifyOtpDefaults,
    mode: "onSubmit",
  });

  // Step 3: Reset Password Form
  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: resetPasswordDefaults,
    mode: "onSubmit",
  });

  // Step 1: Send OTP Mutation
  const sendOtpMutation = useMutation({
    mutationFn: (values: ForgotPasswordValues) => resetPasswordApi.sendOtp(values),
    onSuccess: (data, variables) => {
      // API interceptor will show success toast
      setState(prev => ({
        ...prev,
        step: 2,
        email: variables.email,
      }));
      verifyForm.setValue("email", variables.email);
    },
    onError: (err: any) => {
      // API interceptor will show error toast
      console.error("Send OTP error:", err);
    },
  });

  // Step 2: Verify OTP Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: (values: VerifyOtpValues) => resetPasswordApi.verifyOtp(values),
    onSuccess: (data, variables) => {
      setState(prev => ({
        ...prev,
        step: 3,
        resetToken: data.reset_token,
        resetTokenExpiresAt: data.reset_token_expires_at,
      }));
      resetForm.setValue("email", variables.email);
      resetForm.setValue("reset_token", data.reset_token);
      toast.success("OTP verified successfully");
    },
    onError: (err: any) => {
      // API interceptor will show error toast
      console.error("Verify OTP error:", err);
    },
  });

  // Step 3: Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetPasswordValues) => resetPasswordApi.resetPassword(values),
    onSuccess: (data) => {
      // API interceptor will show success toast
      // Reset to initial state
      setState(initialResetState);
      forgotForm.reset(forgotPasswordDefaults);
      verifyForm.reset(verifyOtpDefaults);
      resetForm.reset(resetPasswordDefaults);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    },
    onError: (err: any) => {
      // API interceptor will show error toast
      console.error("Reset password error:", err);
    },
  });

  const goBack = () => {
    if (state.step === 2) {
      setState(prev => ({ ...prev, step: 1 }));
    } else if (state.step === 3) {
      setState(prev => ({ ...prev, step: 2 }));
    }
  };

  const startOver = () => {
    setState(initialResetState);
    forgotForm.reset(forgotPasswordDefaults);
    verifyForm.reset(verifyOtpDefaults);
    resetForm.reset(resetPasswordDefaults);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold sm:text-xl">Reset Password</h1>
        <p className="text-sm text-muted-foreground">
          Reset your password in a few simple steps.
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border bg-card">
        {/* Header with step indicator */}
        <div className="border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border bg-muted/30">
                {state.step === 1 && <Mail size={18} />}
                {state.step === 2 && <Shield size={18} />}
                {state.step === 3 && <Key size={18} />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  Step {state.step} of 3: {" "}
                  {state.step === 1 && "Enter Email"}
                  {state.step === 2 && "Verify OTP"}
                  {state.step === 3 && "New Password"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {state.step === 1 && "We'll send you a verification code"}
                  {state.step === 2 && "Check your email for the 6-digit code"}
                  {state.step === 3 && "Choose a strong new password"}
                </p>
              </div>
            </div>
            
            {state.step > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Step 1: Send OTP */}
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
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium">
                        Email Address <span className="text-destructive">*</span>
                      </label>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email address"
                        autoComplete="email"
                        className={cn(
                          fieldState.error && "border-destructive focus-visible:ring-destructive/30"
                        )}
                      />
                      {fieldState.error?.message && (
                        <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={sendOtpMutation.isPending}>
                    {sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Step 2: Verify OTP */}
          {state.step === 2 && (
            <Form {...verifyForm}>
              <form
                className="space-y-4"
                onSubmit={verifyForm.handleSubmit(async (values) => {
                  await verifyOtpMutation.mutateAsync(values);
                })}
              >
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Email</label>
                  <Input
                    value={state.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    We sent a 6-digit code to this email address
                  </p>
                </div>

                <FormField
                  control={verifyForm.control}
                  name="otp"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium">
                        Verification Code <span className="text-destructive">*</span>
                      </label>
                      <Input
                        {...field}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className={cn(
                          "text-center text-lg font-mono",
                          fieldState.error && "border-destructive focus-visible:ring-destructive/30"
                        )}
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/\D/g, '');
                          field.onChange(value);
                        }}
                      />
                      {fieldState.error?.message && (
                        <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startOver}
                    disabled={verifyOtpMutation.isPending}
                  >
                    Start Over
                  </Button>
                  <Button type="submit" disabled={verifyOtpMutation.isPending}>
                    {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Step 3: Reset Password */}
          {state.step === 3 && (
            <Form {...resetForm}>
              <form
                className="space-y-4"
                onSubmit={resetForm.handleSubmit(async (values) => {
                  await resetPasswordMutation.mutateAsync(values);
                })}
              >
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Email</label>
                  <Input
                    value={state.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {state.resetTokenExpiresAt && (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={14} />
                      <span>
                        Reset token expires at: {new Date(state.resetTokenExpiresAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <FormField
                  control={resetForm.control}
                  name="new_password"
                  render={({ field, fieldState }) => (
                    <PasswordField
                      label="New Password"
                      required
                      placeholder="Enter your new password"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={fieldState.error}
                      show={showNewPassword}
                      onToggleShow={() => setShowNewPassword(v => !v)}
                      hint="Use at least 8 characters with numbers and symbols"
                      autoComplete="new-password"
                    />
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name="confirm_password"
                  render={({ field, fieldState }) => (
                    <PasswordField
                      label="Confirm New Password"
                      required
                      placeholder="Re-enter your new password"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={fieldState.error}
                      show={showConfirmPassword}
                      onToggleShow={() => setShowConfirmPassword(v => !v)}
                      autoComplete="new-password"
                    />
                  )}
                />

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startOver}
                    disabled={resetPasswordMutation.isPending}
                  >
                    Start Over
                  </Button>
                  <Button type="submit" disabled={resetPasswordMutation.isPending}>
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>

      {/* Success tip */}
      <div className="rounded-2xl border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border bg-card">
            <CheckCircle2 size={18} />
          </span>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Reset Password Tips</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Check your spam/junk folder if you don't see the OTP email.</li>
              <li>The verification code expires after a few minutes.</li>
              <li>Choose a strong password that you haven't used before.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordSettings;