"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Mail,
  RefreshCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

import { profileApi, profileQueryKey } from "../../../api/profile.api";
import {
  emailChangeRequestDefaults,
  emailChangeRequestSchema,
  emailChangeVerifyDefaults,
  emailChangeVerifySchema,
  type EmailChangeRequestValues,
  type EmailChangeVerifyValues,
} from "../../../schema/profile.schema";
import type { AccountProfile } from "../../../types/profile.types";
import {
  applyApiFieldErrors,
  getApiErrorMessage,
} from "../../../utils/api-error";

type EmailChangeStep = "request" | "verify";

type EmailChangeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AccountProfile;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function EmailChangeModal({
  open,
  onOpenChange,
  profile,
}: EmailChangeModalProps) {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<EmailChangeStep>("request");
  const [pendingEmail, setPendingEmail] = useState("");

  const requestMethods = useForm<EmailChangeRequestValues>({
    resolver: zodResolver(emailChangeRequestSchema),
    defaultValues: emailChangeRequestDefaults,
    mode: "onChange",
  });

  const verifyMethods = useForm<EmailChangeVerifyValues>({
    resolver: zodResolver(emailChangeVerifySchema),
    defaultValues: emailChangeVerifyDefaults,
    mode: "onChange",
  });

  const newEmailValue = useWatch({
    control: requestMethods.control,
    name: "new_email",
  });

  const otpValue = useWatch({
    control: verifyMethods.control,
    name: "otp",
  });

  const normalizedCurrentEmail = normalizeEmail(profile.email);
  const normalizedNewEmail = normalizeEmail(newEmailValue ?? "");

  const canRequestOtp = useMemo(() => {
    const result = emailChangeRequestSchema.safeParse({
      new_email: normalizedNewEmail,
    });

    return (
      result.success &&
      normalizedNewEmail.length > 0 &&
      normalizedNewEmail !== normalizedCurrentEmail
    );
  }, [normalizedCurrentEmail, normalizedNewEmail]);

  const canVerifyOtp =
    Boolean(pendingEmail) && /^\d{6}$/.test(otpValue ?? "");

  const requestMutation = useMutation({
    mutationFn: profileApi.requestEmailChange,
  });

  const verifyMutation = useMutation({
    mutationFn: profileApi.verifyEmailChange,
  });

  const isBusy =
    requestMutation.isPending || verifyMutation.isPending;

  const resetModal = () => {
    setStep("request");
    setPendingEmail("");

    requestMethods.reset(emailChangeRequestDefaults);
    requestMethods.clearErrors();

    verifyMethods.reset(emailChangeVerifyDefaults);
    verifyMethods.clearErrors();
  };

  useEffect(() => {
    if (!open) {
      resetModal();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    requestMethods.reset(emailChangeRequestDefaults);
    verifyMethods.reset(emailChangeVerifyDefaults);

    setPendingEmail("");
    setStep("request");
  }, [profile.email, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy) return;

    if (!nextOpen) {
      resetModal();
    }

    onOpenChange(nextOpen);
  };

  const requestOtp = requestMethods.handleSubmit(async (values) => {
    requestMethods.clearErrors();

    const newEmail = normalizeEmail(values.new_email);

    if (newEmail === normalizedCurrentEmail) {
      requestMethods.setError("new_email", {
        type: "validate",
        message: "Enter an email different from your current email",
      });

      return;
    }

    try {
      const response = await requestMutation.mutateAsync({
        new_email: newEmail,
      });

      setPendingEmail(newEmail);

      verifyMethods.reset(emailChangeVerifyDefaults);
      verifyMethods.clearErrors();

      setStep("verify");

      toast.success(
        response.message || "Verification code sent successfully"
      );
    } catch (error) {
      const hasFieldError = applyApiFieldErrors(
        error,
        requestMethods,
        ["new_email"]
      );

      if (!hasFieldError) {
        toast.error(
          getApiErrorMessage(
            error,
            "Failed to send verification code"
          )
        );
      }
    }
  });

  const verifyOtp = verifyMethods.handleSubmit(async (values) => {
    if (!pendingEmail) {
      toast.error("Request a verification code first");
      return;
    }

    verifyMethods.clearErrors();

    try {
      const response = await verifyMutation.mutateAsync({
        new_email: pendingEmail,
        otp: values.otp,
      });

      queryClient.setQueryData<AccountProfile>(
        profileQueryKey,
        (current) =>
          current
            ? {
                ...current,
                email: response.email || pendingEmail,
              }
            : current
      );

      await queryClient.invalidateQueries({
        queryKey: profileQueryKey,
      });

      toast.success(
        response.message || "Email changed successfully"
      );

      resetModal();
      onOpenChange(false);
    } catch (error) {
      const hasFieldError = applyApiFieldErrors(
        error,
        verifyMethods,
        ["otp"]
      );

      if (!hasFieldError) {
        toast.error(
          getApiErrorMessage(
            error,
            "Failed to verify verification code"
          )
        );
      }
    }
  });

  const resendOtp = async () => {
    if (!pendingEmail || isBusy) return;

    try {
      const response = await requestMutation.mutateAsync({
        new_email: pendingEmail,
      });

      verifyMethods.reset(emailChangeVerifyDefaults);
      verifyMethods.clearErrors();

      toast.success(
        response.message ||
          "A new verification code has been sent"
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Failed to resend verification code"
        )
      );
    }
  };

  const goBackToEmail = () => {
    if (isBusy) return;

    setStep("request");
    verifyMethods.reset(emailChangeVerifyDefaults);
    verifyMethods.clearErrors();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "w-[calc(100vw-1.5rem)] max-w-[500px]",
          "max-h-[90svh] overflow-y-auto",
          "p-0"
        )}
      >
        <DialogHeader className="px-5 pb-0 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-muted/30">
                <Mail className="h-[18px] w-[18px]" />
              </span>

              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold">
                  Change email address
                </DialogTitle>

                <p className="mt-1 text-xs text-muted-foreground">
                  Request an OTP first, then verify it before the
                  email changes.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close"
              disabled={isBusy}
              onClick={() => handleOpenChange(false)}
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-md",
                "text-muted-foreground transition-colors",
                "hover:bg-accent hover:text-foreground",
                "disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 border-b" />
        </DialogHeader>

        <div className="space-y-4 px-5 pb-5 pt-4">
          <div className="rounded-xl border bg-muted/20 px-3 py-3">
            <p className="text-xs text-muted-foreground">
              Current email
            </p>

            <p className="mt-1 break-all text-sm font-medium">
              {profile.email}
            </p>
          </div>

          <div className="grid grid-cols-2 border shadow-sm">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setStep("request")}
              className={cn(
                "h-9 border-r text-sm font-medium transition-colors",
                step === "request"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-muted/50"
              )}
            >
              1. New email
            </button>

            <button
              type="button"
              disabled={!pendingEmail || isBusy}
              onClick={() => {
                if (pendingEmail) {
                  setStep("verify");
                }
              }}
              className={cn(
                "h-9 text-sm font-medium transition-colors",
                step === "verify"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted/50",
                !pendingEmail &&
                  "cursor-not-allowed opacity-60"
              )}
            >
              2. Verify OTP
            </button>
          </div>

          {step === "request" ? (
            <Form {...requestMethods}>
              <form
                onSubmit={requestOtp}
                className="space-y-5"
              >
                <FormField
                  control={requestMethods.control}
                  name="new_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        New email address
                        <span className="text-destructive">
                          {" "}
                          *
                        </span>
                      </FormLabel>

                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="name@example.com"
                          autoComplete="email"
                          disabled={isBusy}
                          value={field.value ?? ""}
                          onChange={(event) => {
                            field.onChange(event.target.value);

                            if (
                              requestMethods.formState.errors
                                .new_email
                            ) {
                              requestMethods.clearErrors(
                                "new_email"
                              );
                            }
                          }}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isBusy || !canRequestOtp}
                  >
                    {requestMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      "Request OTP"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...verifyMethods}>
              <form
                onSubmit={verifyOtp}
                className="space-y-5"
              >
                <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                  <div className="min-w-0 text-sm">
                    <p className="font-medium">
                      OTP requested
                    </p>

                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Enter the code sent to your existing email to
                      confirm{" "}
                      <strong className="break-all text-foreground">
                        {pendingEmail}
                      </strong>
                      .
                    </p>
                  </div>
                </div>

                <FormField
                  control={verifyMethods.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="space-y-1 text-center">
                        <FormLabel className="text-lg font-semibold">
                          Verify
                        </FormLabel>

                        <p className="text-sm text-muted-foreground">
                          Your code was sent to you via email
                        </p>
                      </div>

                      <FormControl>
                        <div className="flex justify-center">
                          <InputOTP
                            maxLength={6}
                            pattern={REGEXP_ONLY_DIGITS}
                            autoComplete="one-time-code"
                            disabled={isBusy}
                            value={field.value ?? ""}
                            onChange={(value) => {
                              field.onChange(value);

                              if (
                                verifyMethods.formState.errors.otp
                              ) {
                                verifyMethods.clearErrors("otp");
                              }
                            }}
                          >
                            <InputOTPGroup className="gap-2">
                              {Array.from({ length: 6 }).map(
                                (_, index) => (
                                  <InputOTPSlot
                                    key={index}
                                    index={index}
                                    className={cn(
                                      "h-12 w-10 rounded-md border text-base",
                                      "first:rounded-md last:rounded-md",
                                      "sm:w-12"
                                    )}
                                  />
                                )
                              )}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </FormControl>

                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isBusy || !pendingEmail}
                    onClick={resendOtp}
                  >
                    {requestMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="mr-2 h-4 w-4" />
                    )}

                    Resend OTP
                  </Button>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isBusy}
                      onClick={goBackToEmail}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>

                    <Button
                      type="submit"
                      disabled={isBusy || !canVerifyOtp}
                    >
                      {verifyMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying…
                        </span>
                      ) : (
                        "Verify and change email"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmailChangeModal;