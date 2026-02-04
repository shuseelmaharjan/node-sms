"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Mail, ShieldCheck, KeyRound, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
} from "../../org/schema/reset-password.schema";
import { resetPasswordApi } from "../../org/api/reset-password.api";
import { InputField } from "@/components/fields/InputField";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";

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
    <div className="space-y-2">
      <Label className="text-xs sm:text-sm font-medium">{label}</Label>
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
      {error?.message ? <p className="text-xs font-medium text-destructive">{error.message}</p> : null}
    </div>
  );
}

function StepBadge({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1, label: "Email", icon: Mail },
    { n: 2, label: "OTP", icon: ShieldCheck },
    { n: 3, label: "New password", icon: KeyRound },
  ] as const;

  return (
    <div className="flex items-center justify-between gap-2">
      {items.map((it, idx) => {
        const active = it.n === step;
        const done = it.n < step;
        const Icon = it.icon;

        return (
          <div key={it.n} className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                "h-8 w-8 rounded-full border grid place-items-center shrink-0",
                done && "bg-primary text-primary-foreground border-primary",
                active && !done && "border-primary text-primary",
                !active && !done && "text-muted-foreground"
              )}
            >
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                {it.label}
              </p>
              <p className="text-[11px] text-muted-foreground">Step {it.n}</p>
            </div>

            {idx !== items.length - 1 ? <div className="mx-1 h-px w-6 bg-border sm:w-10" /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function ForgotPasswordPage() {
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

  const stepTitle = useMemo(() => {
    if (state.step === 1) return "Forgot your password?";
    if (state.step === 2) return "Verify OTP";
    return "Set a new password";
  }, [state.step]);

  const stepDesc = useMemo(() => {
    if (state.step === 1) return "Enter your email and we’ll send you a one-time code.";
    if (state.step === 2) return "Enter the 6-digit code sent to your email.";
    return "Choose a strong password you don’t use elsewhere.";
  }, [state.step]);

  const sendOtpMutation = useMutation({
    mutationFn: (values: ForgotPasswordValues) => resetPasswordApi.sendOtp(values),
    onSuccess: (_data, variables) => {
      setState((prev) => ({ ...prev, step: 2, email: variables.email }));
      verifyForm.setValue("email", variables.email);
      toast.success("OTP sent. Please check your email.");
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

  const isBusy = sendOtpMutation.isPending || verifyOtpMutation.isPending || resetPasswordMutation.isPending;

  return (
    <div className="min-h-[calc(100vh-1px)] w-full flex items-center justify-center px-4 py-10">
      {/* background decoration (matches your login page vibe) */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 [background:radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.12),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.12),transparent_50%)]" />

      <Card className="w-full max-w-md shadow-lg border-slate-200/70 dark:border-slate-800/70">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground",
                isBusy && "pointer-events-none opacity-60"
              )}
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={startOver}
              disabled={isBusy}
              className="gap-2"
            >
              <RotateCcw size={14} />
              Start over
            </Button>
          </div>

          <CardTitle className="text-2xl">{stepTitle}</CardTitle>
          <CardDescription>{stepDesc}</CardDescription>

          <div className="pt-2">
            <StepBadge step={state.step as 1 | 2 | 3} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />

          {/* Step controls */}
          <div className="flex items-center justify-between hidden">
            <p className="text-xs text-muted-foreground">Step {state.step} of 3</p>

            {state.step > 1 ? (
              <Button type="button" variant="outline" size="sm" onClick={goBack} disabled={isBusy}>
                Back
              </Button>
            ) : (
              <span />
            )}
          </div>

          {/* STEP 1 */}
          {state.step === 1 && (
            <Form {...forgotForm}>
              <form
                className="space-y-5"
                onSubmit={forgotForm.handleSubmit(async (values) => {
                  await sendOtpMutation.mutateAsync(values);
                })}
              >
                <FormField
                  control={forgotForm.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <InputField
                      {...field}
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      label="Email"
                      required
                      error={fieldState.error}
                      hint="We’ll send a one-time code to this email."
                    />
                  )}
                />
                <Button type="submit" className="w-full" disabled={sendOtpMutation.isPending}>
                  {sendOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            </Form>
          )}

          {/* STEP 2 */}
          {state.step === 2 && (
            <Form {...verifyForm}>
              <form
                className="space-y-5"
                onSubmit={verifyForm.handleSubmit(async (values) => {
                  await verifyOtpMutation.mutateAsync(values);
                })}
              >
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input value={state.email} disabled className="bg-muted" />
                </div>

                <span className="text-sm text-muted-foreground mb-4 block text-center">
                  Enter the 6-digit code we sent to your email.
                </span>

                <FormField
                  control={verifyForm.control}
                  name="otp"
                  render={({ field, fieldState }) => (
                    <OtpInput
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                      helperText="Check spam/junk if you don’t see it."
                    />
                  )}
                />

                <Button type="submit" className="w-full" disabled={verifyOtpMutation.isPending}>
                  {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={sendOtpMutation.isPending}
                  onClick={async () => {
                    // resend using stored email
                    await sendOtpMutation.mutateAsync({ email: state.email });
                  }}
                >
                  {sendOtpMutation.isPending ? "Resending..." : "Resend code"}
                </Button>
              </form>
            </Form>
          )}

          {/* STEP 3 */}
          {state.step === 3 && (
            <Form {...resetForm}>
              <form
                className="space-y-5"
                onSubmit={resetForm.handleSubmit(async (values) => {
                  await resetPasswordMutation.mutateAsync(values);
                })}
              >
                {/* <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={state.email} disabled className="bg-muted" />
                </div> */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
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
                    Expires in: {new Date(state.resetTokenExpiresAt).toLocaleString()}
                  </p>
                ) : null}
              </form>
            </Form>
          )}

          <Separator />

          <p className="text-center text-xs text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Sign in
            </Link>
          </p>

          <p className="text-pretty mt-4 text-xs text-muted-foreground">
            Read our {" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              terms of service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              privacy policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ForgotPasswordPage;
