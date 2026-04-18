"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type TagsInputFieldProps = {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: { message?: string } | string | null;
  hint?: string;
  maxTags?: number;
};

function normalizeTag(tag: string) {
  return tag.trim().replace(/\s+/g, " ");
}

export function TagsInputField({
  label,
  value,
  onChange,
  placeholder = "Type tag and press Enter",
  disabled,
  required,
  error,
  hint,
  maxTags = 20,
}: TagsInputFieldProps) {
  const [inputValue, setInputValue] = React.useState("");

  const errorMessage =
    typeof error === "string" ? error : error?.message;

  const addTag = React.useCallback(
    (raw: string) => {
      const next = normalizeTag(raw);
      if (!next) return;
      if (value.length >= maxTags) return;

      const exists = value.some(
        (tag) => tag.toLowerCase() === next.toLowerCase()
      );
      if (exists) return;

      onChange([...value, next]);
      setInputValue("");
    },
    [maxTags, onChange, value]
  );

  const removeTag = React.useCallback(
    (tagToRemove: string) => {
      onChange(value.filter((tag) => tag !== tagToRemove));
    },
    [onChange, value]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
      return;
    }

    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      {label ? (
        <label className="text-sm font-medium">
          {label} {required ? <span className="text-destructive">*</span> : null}
        </label>
      ) : null}

      <div
        className={cn(
          "min-h-11 rounded-md border bg-background px-3 py-2",
          "flex flex-wrap items-center gap-2",
          disabled && "cursor-not-allowed opacity-60",
          errorMessage && "border-destructive"
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm"
          >
            <span>{tag}</span>
            {!disabled ? (
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-background"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </span>
        ))}

        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[140px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
        />
      </div>

      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}

      {errorMessage ? (
        <p className="text-xs font-medium text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}