"use client";

import * as React from "react";
import type { FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type InputFieldProps = React.ComponentProps<typeof Input> & {
  label?: string;
  hint?: string;
  error?: FieldError;
  required?: boolean;
};

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, hint, error, required, className, id, ...props }, ref) => {
    const inputId = id ?? React.useId();

    return (
      <div className="space-y-2">
        {label && (
          <Label
            htmlFor={inputId}
            className="text-xs sm:text-sm font-medium"
          >
            {label}
            {required ? <span className="text-destructive ml-0.5">*</span> : null}
          </Label>
        )}

        <Input
          ref={ref}
          id={inputId}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive/30",
            className
          )}
          {...props}
        />

        {hint && !error && (
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
            {hint}
          </p>
        )}

        {error?.message && (
          <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
            {error.message}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";
