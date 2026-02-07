// components/nepaliDate/NepaliBsDatePickerField.tsx
"use client";

import * as React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  theme?: "primary" | "default";
  /**
   * Minimum allowed BS date in YYYY-MM-DD.
   * NOTE: We enforce this in React (NOT via nepaliDatePicker options),
   * because passing unknown options like minDate can cause NaN header issues.
   */
  minDateBs?: string;
};

declare global {
  interface HTMLElement {
    nepaliDatePicker?: (opts?: any) => void;
  }
}

/** Pick the currently open/visible nepaliDatePicker container (plugin often reuses a shared container). */
function getActiveNdpContainer(): HTMLElement | null {
  const all = Array.from(document.querySelectorAll(".ndp-container")) as HTMLElement[];

  const visible = all.filter((el) => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      rect.width > 0 &&
      rect.height > 0
    );
  });

  // usually the last visible is the one just opened
  return (visible.at(-1) ?? all.at(-1) ?? null) as HTMLElement | null;
}

function positionNdpContainer(inputEl: HTMLInputElement) {
  const container = getActiveNdpContainer();
  if (!container) return;

  // Put it in body so Dialog parents don't clip it
  if (container.parentElement !== document.body) {
    document.body.appendChild(container);
  }

  container.style.zIndex = "999999";
  container.style.position = "fixed";

  const r = inputEl.getBoundingClientRect();
  const gap = 6;

  // initial placement
  container.style.top = `${r.bottom + gap}px`;
  container.style.left = `${r.left}px`;

  // clamp after layout settles (important)
  const clamp = () => {
    const cr = container.getBoundingClientRect();

    // keep inside viewport horizontally
    const overflowRight = cr.right - window.innerWidth;
    if (overflowRight > 0) {
      container.style.left = `${Math.max(8, r.left - overflowRight - 8)}px`;
    }

    // flip above if it overflows bottom
    const overflowBottom = cr.bottom - window.innerHeight;
    if (overflowBottom > 0) {
      container.style.top = `${Math.max(8, r.top - cr.height - gap)}px`;
    }
  };

  requestAnimationFrame(() => {
    clamp();
    requestAnimationFrame(clamp);
  });
}

function isValidBsDateStr(v?: string) {
  return Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));
}

/** BS format YYYY-MM-DD can be compared lexicographically. */
function isBeforeBs(a: string, b: string) {
  return a < b;
}

export function NepaliBsDatePickerField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  placeholder = "YYYY-MM-DD (BS)",
  hint = "",
  required = false,
  theme = "primary",
  minDateBs,
}: Props<T>) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const initializedRef = React.useRef(false);
  const latestValueRef = React.useRef<string>("");
  const id = React.useId();

  // We enforce minDate in React (NOT in nepaliDatePicker options)
  const min = isValidBsDateStr(minDateBs) ? minDateBs : undefined;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = Boolean(fieldState.error);

        const applyCurrentValueToPicker = React.useCallback(
          (el: HTMLInputElement) => {
            const v = latestValueRef.current;
            if (!v) return;

            if (el.value !== v) el.value = v;

            // Let plugin detect existing value (for highlight)
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
          },
          []
        );

        const schedulePositionAndSync = React.useCallback(() => {
          const el = inputRef.current;
          if (!el) return;

          // ensure plugin reads existing value and highlight
          applyCurrentValueToPicker(el);

          // position popup (repeat after open/layout)
          positionNdpContainer(el);
          window.setTimeout(() => {
            applyCurrentValueToPicker(el);
            positionNdpContainer(el);
          }, 0);
          window.setTimeout(() => {
            applyCurrentValueToPicker(el);
            positionNdpContainer(el);
          }, 50);
        }, [applyCurrentValueToPicker]);

        // Keep DOM value in sync with RHF and remember latest value
        React.useEffect(() => {
          latestValueRef.current = String(field.value ?? "");
          const el = inputRef.current;
          if (!el) return;
          if (el.value !== latestValueRef.current) el.value = latestValueRef.current;
        }, [field.value]);

        // Init plugin once (when script is ready)
        React.useEffect(() => {
          const el = inputRef.current;
          if (!el) return;
          if (initializedRef.current) return;

          const tryInit = () => {
            if (typeof el.nepaliDatePicker !== "function") return false;

            // IMPORTANT:
            // Do NOT pass "minDate" (or other unsupported options) into this plugin,
            // it can break its internal header calc and show NaN-NaN.
            el.nepaliDatePicker({
              dateFormat: "YYYY-MM-DD",
              closeOnDateSelect: true,
              theme: theme === "primary" ? "primary" : "default",
            });

            initializedRef.current = true;

            window.setTimeout(() => {
              applyCurrentValueToPicker(el);
              positionNdpContainer(el);
            }, 0);

            return true;
          };

          if (tryInit()) return;

          const t = window.setInterval(() => {
            if (tryInit()) window.clearInterval(t);
          }, 100);

          return () => window.clearInterval(t);
        }, [theme, applyCurrentValueToPicker]);

        // Re-position on scroll/resize (helps inside modals/scrollable dialogs)
        React.useEffect(() => {
          const el = inputRef.current;
          if (!el) return;

          const handler = () => schedulePositionAndSync();

          window.addEventListener("scroll", handler, true);
          window.addEventListener("resize", handler);

          return () => {
            window.removeEventListener("scroll", handler, true);
            window.removeEventListener("resize", handler);
          };
        }, [schedulePositionAndSync]);

        // Sync plugin changes -> RHF (and enforce min date here)
        React.useEffect(() => {
          const el = inputRef.current;
          if (!el) return;

          const sync = () => {
            const next = (el.value ?? "").trim();

            // Enforce minDateBs in React
            if (min && isValidBsDateStr(next) && isBeforeBs(next, min)) {
              // revert input to last valid value (or clear)
              const prev = latestValueRef.current || "";
              el.value = prev;
              if (String(field.value ?? "") !== prev) field.onChange(prev);
              return;
            }

            if (String(field.value ?? "") !== next) field.onChange(next);
          };

          el.addEventListener("input", sync);
          el.addEventListener("change", sync);
          el.addEventListener("blur", sync);

          // Some builds set value without events
          const poll = window.setInterval(sync, 200);

          return () => {
            el.removeEventListener("input", sync);
            el.removeEventListener("change", sync);
            el.removeEventListener("blur", sync);
            window.clearInterval(poll);
          };
        }, [field.onChange, field.value, min]);

        return (
          <div className="space-y-2" data-ndp-scope>
            <Label htmlFor={id} className="text-xs sm:text-sm font-medium">
              {label}
              {required ? <span className="text-destructive ml-0.5">*</span> : null}
            </Label>

            <Input
              id={id}
              ref={inputRef}
              disabled={disabled}
              placeholder={placeholder}
              className={cn(
                "w-full",
                hasError && "border-destructive focus-visible:ring-destructive/30"
              )}
              autoComplete="off"
              onChange={(e) => {
                // manual typing also respects minDate
                const v = e.target.value;
                if (min && isValidBsDateStr(v) && isBeforeBs(v, min)) return;
                field.onChange(v);
              }}
              onBlur={() => field.onBlur()}
              onFocus={schedulePositionAndSync}
              onClick={schedulePositionAndSync}
              data-npdp-theme={theme}
            />

            {!hasError ? (
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
                {hint}
              </p>
            ) : (
              <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
                {fieldState.error?.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
