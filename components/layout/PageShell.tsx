"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function PageShell(props: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", props.className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold sm:text-xl">{props.title}</h1>
          {props.description ? (
            <p className="text-sm text-muted-foreground">{props.description}</p>
          ) : null}
        </div>

        {props.actions ? <div className="shrink-0">{props.actions}</div> : null}
      </div>

      <div className="rounded-lg border bg-card p-4">{props.children}</div>
    </div>
  );
}
