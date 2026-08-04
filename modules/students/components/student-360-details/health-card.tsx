import * as React from "react";

import { Badge } from "@/components/ui/badge";

import type { ManagedHealth } from "../../types/management-profile.types";
import type { StudentOtherInfo } from "../../types/student360.types";

export function HealthCard({
  info,
}: {
  info: ManagedHealth | StudentOtherInfo | null | undefined;
}) {
  if (!info) {
    return (
      <div className="text-sm text-muted-foreground">
        No health information.
      </div>
    );
  }

  const flags = [
    ["Disabled", info.is_disabled, info.disability_details],
    ["Visual issues", info.visual_issues, ""],
    ["Hearing issues", info.hearing_issues, ""],
    ["Mobility issues", info.mobility_issues, ""],
    ["Chronic illness", info.chronic_illness, info.chronic_illness_details],
    ["Allergies", info.allergies, info.allergy_details],
    ["Medications", info.medications, info.medication_details],
    [
      "Dietary restrictions",
      info.dietary_restrictions,
      info.dietary_restriction_details,
    ],
    [
      "Other health issues",
      info.other_health_issues,
      info.other_health_issue_details,
    ],
  ] as const;

  return (
    <div className="space-y-3">
      {flags.map(([label, on, details]) => (
        <div
          key={label}
          className="rounded-xl border bg-gradient-to-br from-muted/40 to-background p-3"
        >
          <div className="flex items-center justify-between">
            <div className="font-medium">{label}</div>
            <Badge variant={on ? "active" : "other"} label={on ? "Yes" : "No"} />
          </div>
          {on && details ? (
            <div className="mt-2 text-sm text-muted-foreground">{details}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
