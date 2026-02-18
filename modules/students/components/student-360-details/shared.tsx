import * as React from "react";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function EmptyCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function ScopePill({
  label,
  active,
  right,
  onClick,
}: {
  label: string;
  active?: boolean;
  right?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex rounded-full items-center gap-2 border px-3 py-1 text-xs transition",
        active
          ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
          : "bg-background hover:bg-muted/40 text-muted-foreground"
      )}
      title={label}
    >
      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      <span className="truncate max-w-[180px]">{label}</span>
      {right ? <span className="hidden md:inline-flex">{right}</span> : null}
    </button>
  );
}

export function MiniStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-white/5 p-2 border border-white/10">
      <div className="text-white/70">{k}</div>
      <div className="font-semibold tabular-nums">{v}</div>
    </div>
  );
}

export function InfoRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border bg-gradient-to-br from-muted/30 to-background p-3 rounded-xl">
      <div className="text-sm text-muted-foreground">{k}</div>
      <div className="text-sm font-semibold">{v}</div>
    </div>
  );
}

export function StatCard({
  title,
  value,
  icon,
  grad,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  grad: string;
}) {
  return (
    <div className={cn("border p-3 bg-gradient-to-br", grad)}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      <Badge variant="other" label={`${count}`} />
    </div>
  );
}
