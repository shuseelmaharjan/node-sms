"use client";

import type { ReactNode } from "react";
import { SettingsSidebar } from "@/modules/settings/components/SettingsSidebar";
import { SettingsMobileNav } from "@/modules/settings/components/SettingsMobileNav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(90svh-64px)] p-0 md:p-4">
      <div className="mx-auto w-full">
        {/* Mobile navigation */}
        <div className="lg:hidden sticky top-0 z-10 -mx-3 mb-4 border-b bg-background/80 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none sm:text-base">
                Settings
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Configuration & setup
              </p>
            </div>

            <SettingsMobileNav />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
            <SettingsSidebar />
          </aside>

          {/* Content surface */}
          <main className="min-w-0">
            <div className="rounded-2xl border-none md:border bg-card p-2 md:p-6 shadow-none md:shadow-sm">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
