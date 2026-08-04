import type { ReactNode } from "react";
import { Pencil, Phone, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { AccountProfile } from "../../types/profile.types";

function fullName(profile: AccountProfile) {
  return [profile.first_name, profile.middle_name, profile.last_name]
    .filter((part) => part?.trim())
    .join(" ");
}

export function PersonalInfoSummaryCard({
  profile,
  onEdit,
}: {
  profile: AccountProfile;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-2xl border bg-card">
      <div className="flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-muted/30">
            <UserRound className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-medium">Personal information</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your legal name and primary phone number.
            </p>
          </div>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
        <InfoItem label="Full name" value={fullName(profile) || "—"} />
        <InfoItem
          label="Phone number"
          value={profile.phone || "—"}
          icon={<Phone className="h-4 w-4" />}
        />
        <InfoItem label="First name" value={profile.first_name || "—"} />
        <InfoItem label="Middle name" value={profile.middle_name || "—"} />
        <InfoItem label="Last name" value={profile.last_name || "—"} />
        <InfoItem label="Username" value={profile.username || "—"} />
      </div>
    </section>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex min-w-0 items-center gap-2">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
