"use client";

import { ReactNode } from "react";

interface SchoolsLayoutProps {
  children: ReactNode;
}

export function SchoolsLayout({ children }: SchoolsLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">School Information</h2>
        <p className="text-muted-foreground">Manage your school&apos;s basic information and settings.</p>
      </div>
      {children}
    </div>
  );
}
