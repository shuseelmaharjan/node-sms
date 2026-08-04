"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SummaryCardColor =
  | "blue"
  | "green"
  | "orange"
  | "red";

const summaryStyles: Record<
  SummaryCardColor,
  {
    card: string;
    icon: string;
    value: string;
  }
> = {
  blue: {
    card:
      "border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:border-blue-900/50 dark:from-blue-950/30 dark:to-background",
    icon:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    value: "text-blue-700 dark:text-blue-300",
  },

  green: {
    card:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-background",
    icon:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    value: "text-emerald-700 dark:text-emerald-300",
  },

  orange: {
    card:
      "border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:border-amber-900/50 dark:from-amber-950/30 dark:to-background",
    icon:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    value: "text-amber-700 dark:text-amber-300",
  },

  red: {
    card:
      "border-rose-200 bg-gradient-to-br from-rose-50 to-white dark:border-rose-900/50 dark:from-rose-950/30 dark:to-background",
    icon:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    value: "text-rose-700 dark:text-rose-300",
  },
};

type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  color: SummaryCardColor;
};

export function SummaryCard({
  title,
  value,
  description,
  icon,
  color,
}: SummaryCardProps) {
  const style = summaryStyles[color];

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        style.card
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <p
            className={cn(
              "mt-2 break-words text-2xl font-bold tracking-tight tabular-nums",
              style.value
            )}
          >
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            style.icon
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

type InvoiceAmountTone =
  | "success"
  | "warning"
  | "neutral";

const invoiceAmountStyles: Record<
  InvoiceAmountTone,
  string
> = {
  success:
    "text-emerald-600 dark:text-emerald-300",
  warning:
    "text-amber-600 dark:text-amber-300",
  neutral:
    "text-foreground",
};

export function InvoiceAmount({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: InvoiceAmountTone;
}) {
  return (
    <div className="min-w-[140px] rounded-lg border bg-card px-3 py-2">
      <div className="text-xs text-muted-foreground">
        {label}
      </div>

      <div
        className={cn(
          "text-sm font-semibold",
          invoiceAmountStyles[tone]
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function EmptyRecord({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-5 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">
          {label}
        </p>

        {description ? (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </div>
  );
}