"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  error,
  helperText,
}: OtpInputProps) {
  const inputs = React.useRef<Array<HTMLInputElement | null>>([]);

  const values = Array.from({ length }, (_, i) => value[i] ?? "");

  function focusInput(index: number) {
    inputs.current[index]?.focus();
  }

  function handleChange(index: number, char: string) {
    if (!/^\d?$/.test(char)) return;

    const next = value.split("");
    next[index] = char;
    onChange(next.join("").slice(0, length));

    if (char && index < length - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      focusInput(index - 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    focusInput(Math.min(pasted.length, length - 1));
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-center gap-3">
        {values.map((char, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            value={char}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            className={cn(
              "h-12 w-10 sm:h-14 sm:w-12 rounded-lg border text-center text-lg font-mono",
              "focus:outline-none focus:ring-2 focus:ring-primary/40",
              error && "border-destructive focus:ring-destructive/40"
            )}
          />
        ))}
      </div>

      {error ? (
        <p className="text-xs font-medium text-destructive text-center">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground text-center">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
