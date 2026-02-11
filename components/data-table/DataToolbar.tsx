// components/data-table/DataToolbar.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Search, X } from "lucide-react";

export type DataToolbarFilters = Record<
  string,
  {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
    label?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    widthClassName?: string; // e.g. "w-[220px]"
  }
>;

export type DataToolbarProps = {
  className?: string;

  /** disables search/filters/actions/refresh */
  disabled?: boolean;

  /** loading should NOT disable inputs; use only for visual hints if needed */
  loading?: boolean;

  search?: {
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
    enabled?: boolean;
    disabled?: boolean;
  };

  filters?: DataToolbarFilters;

  /** right side custom actions (buttons etc.) */
  actions?: React.ReactNode;

  refresh?: {
    onClick: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
    title?: string;
  };

  /** if false, hides the left search slot entirely */
  showSearchSlot?: boolean;
};

export function DataToolbar({
  className,
  disabled = false,
  loading = false, // kept for future use; does not disable typing
  search,
  filters,
  actions,
  refresh,
  showSearchSlot = true,
}: DataToolbarProps) {
  // ✅ IMPORTANT: do NOT include `loading` here
  const isDisabled = disabled;

  const searchEnabled = (search?.enabled ?? true) && Boolean(search);
  const searchValue = search?.value ?? "";
  const onSearchChange = search?.onChange;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {/* Left: Search */}
      <div className="w-full sm:max-w-xs">
        {showSearchSlot && searchEnabled ? (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={search?.placeholder ?? "Search…"}
              disabled={isDisabled || Boolean(search?.disabled)}
              className={cn("pl-9 pr-9", "h-10 sm:h-9", "bg-background")}
            />

            {searchValue ? (
              <button
                type="button"
                onClick={() => onSearchChange?.("")}
                disabled={isDisabled || Boolean(search?.disabled)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Right: Filters + Actions + Refresh */}
      <div className="flex items-center justify-end gap-2">
        {/* Filters */}
        {filters
          ? Object.entries(filters).map(([key, filter]) => (
              <div key={key} className="flex items-center gap-2">
                {filter.label ? (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {filter.icon ? (
                      <span className="inline-flex mr-1">{filter.icon}</span>
                    ) : null}
                    {filter.label}:
                  </span>
                ) : null}

                <Select
                  value={filter.value}
                  onValueChange={filter.onChange}
                  disabled={isDisabled || Boolean(filter.disabled)}
                >
                  <SelectTrigger
                    className={cn(filter.widthClassName ?? "w-[180px]", "h-10 sm:h-9")}
                  >
                    <SelectValue placeholder={filter.placeholder ?? "Filter"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))
          : null}

        {/* Actions */}
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}

        {/* Refresh */}
        {refresh ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={refresh.onClick}
            disabled={isDisabled || Boolean(refresh.disabled)}
            title={refresh.title ?? "Refresh"}
            aria-label={refresh.title ?? "Refresh"}
          >
            {refresh.icon ? refresh.icon : "↻"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
