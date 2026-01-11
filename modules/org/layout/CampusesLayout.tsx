"use client";

import { ReactNode } from "react";

interface CampusesLayoutProps {
  children: ReactNode;
}

export function CampusesLayout({ children }: CampusesLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Campuses</h2>
        <p className="text-muted-foreground">Manage your organization&apos;s campuses and locations.</p>
      </div>
      {children}
    </div>
  );
}
