"use client";

import * as React from "react";
import type { FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InputFieldProps = React.ComponentProps<typeof Input> & {
  label?: string;
  hint?: string;
  error?: FieldError;
  required?: boolean;
};

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, hint, error, required, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              {label} {required ? <span className="text-destructive">*</span> : null}
            </label>
          </div>
        )}

        <Input
          ref={ref}
          className={cn(error && "border-destructive focus-visible:ring-destructive/30", className)}
          {...props}
        />

        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
        {error?.message && <p className="text-xs font-medium text-destructive">{error.message}</p>}
      </div>
    );
  }
);

InputField.displayName = "InputField";
