// components/fields/TextareaField.tsx
"use client";

import * as React from "react";
import type { FieldError } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";

export const TextareaField = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    description?: string;
    error?: FieldError;
  }
>(function TextareaField({ label, description, error, ...props }, ref) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      <Textarea ref={ref} {...props} />

      {error?.message && (
        <p className="text-xs font-medium text-destructive">{error.message}</p>
      )}
    </div>
  );
});
