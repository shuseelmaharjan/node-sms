"use client";

import { SettingsNav } from "./settings-nav";

export function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-xl border bg-card p-3 lg:sticky lg:top-4 lg:h-[calc(100svh-2rem)] lg:overflow-auto">
        <div className="px-2 pb-2 pt-1">
          <h2 className="text-sm font-semibold">Settings</h2>
          <p className="text-xs text-muted-foreground">Configuration & setup</p>
        </div>
        <SettingsNav />
      </aside>

      <section className="rounded-xl border bg-card p-5">{children}</section>
    </div>
  );
}
