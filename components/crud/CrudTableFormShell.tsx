"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CrudTableFormShellProps = {
  title?: string;
  className?: string;

  /** Top: form section */
  formTitle?: string;
  formDescription?: string;
  form: React.ReactNode;

  /** Bottom: table section */
  tableTitle?: string;
  tableToolbar?: React.ReactNode; // search, refresh, filters
  table: React.ReactNode;
};

export function CrudTableFormShell({
  title,
  className,

  formTitle,
  formDescription,
  form,

  tableTitle = "List",
  tableToolbar,
  table,
}: CrudTableFormShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page Title */}
      {title ? <h1 className="text-2xl font-semibold hidden">{title}</h1> : null}

      {/* Form Card */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        {(formTitle || formDescription) && (
          <div className="p-4">
            {formTitle ? <p className="text-sm font-semibold text-primary">{formTitle}</p> : null}
            {formDescription ? (
              <p className="mt-1 text-xs text-muted-foreground">{formDescription}</p>
            ) : null}
          </div>
        )}
        <div className="p-4">{form}</div>
      </div>

      {/* Table Card */}
      <div className="bg-card overflow-hidden py-2">
        <div className="flex flex-col gap-3 p-0 sm:flex-row sm:items-center sm:justify-end">
          {tableToolbar ? <div className="flex items-center gap-2">{tableToolbar}</div> : null}
        </div>

        {/* Mobile friendly: allow horizontal scroll if table is wide */}
        <div>
          <div className="overflow-x-auto mt-4">{table}</div>
        </div>
      </div>
    </div>
  );
}
