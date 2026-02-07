// components/fields/SwitchField.tsx
"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import type { FieldError } from "react-hook-form";

export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  error,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  error?: FieldError;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      </div>

      {error?.message && <p className="text-xs font-medium text-destructive">{error.message}</p>}
    </div>
  );
}
