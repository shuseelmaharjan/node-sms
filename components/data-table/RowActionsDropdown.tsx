"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RowActionVariant = "default" | "destructive";

export type RowActionItem<T> = {
  key: string;
  label: string;

  /** optional icon on the left */
  icon?: React.ReactNode;

  /** optional shortcut text on the right (e.g. "⌘E") */
  shortcut?: string;

  /** disable item */
  disabled?: boolean;

  /** for future tooltip usage (doesn't change UI now) */
  disabledReason?: string;

  /** click handler (kept for backward compatibility) */
  onSelect?: (row: T) => void | Promise<void>;

  /** optional link action (if provided, uses Link and ignores onSelect) */
  href?: string | ((row: T) => string);

  /** style */
  variant?: RowActionVariant;

  /** insert separator before this item */
  separatorBefore?: boolean;
};

export function RowActionsDropdown<T>({
  row,
  label = "Actions",
  items,
  align = "end",

  /** keep old look by default */
  showLabel = true,

  /** allow overriding trigger */
  trigger,
  triggerAriaLabel = "Open actions",
}: {
  row: T;
  label?: string;
  items: RowActionItem<T>[];
  align?: "start" | "center" | "end";

  showLabel?: boolean;

  /** custom trigger node; if omitted uses the 3-dots icon button */
  trigger?: React.ReactNode;
  triggerAriaLabel?: string;
}) {
  const hasAnyItem = items?.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ? (
          // custom trigger provided
          <span aria-label={triggerAriaLabel}>{trigger}</span>
        ) : (
          // default trigger
          <Button variant="ghost" size="icon" aria-label={triggerAriaLabel} disabled={!hasAnyItem}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="w-52">
        {showLabel ? (
          <>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}

        {items.map((it) => {
          const destructive = it.variant === "destructive";
          const href = typeof it.href === "function" ? it.href(row) : it.href;

          const content = (
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {it.icon ? <span className="shrink-0">{it.icon}</span> : null}
                <span className="truncate">{it.label}</span>
              </div>
              {it.shortcut ? (
                <span className="text-xs text-muted-foreground shrink-0">{it.shortcut}</span>
              ) : null}
            </div>
          );

          return (
            <React.Fragment key={it.key}>
              {it.separatorBefore ? <DropdownMenuSeparator /> : null}

              {href ? (
                <DropdownMenuItem
                  asChild
                  disabled={it.disabled}
                  className={cn(destructive && "text-destructive")}
                >
                  <Link href={href} prefetch={false}>
                    {content}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    if (it.disabled) return;
                    it.onSelect?.(row);
                  }}
                  disabled={it.disabled}
                  className={cn(destructive && "text-destructive")}
                >
                  {content}
                </DropdownMenuItem>
              )}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
