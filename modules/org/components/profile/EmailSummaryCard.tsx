import { Mail, Pencil, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { AccountProfile } from "../../types/profile.types";

export function EmailSummaryCard({
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
            <Mail className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-medium">Email address</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Used for sign-in, security alerts, and verification.
            </p>
          </div>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Change
        </Button>
      </div>

      <div className="p-4 sm:p-6">
        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">Current email</p>
          <p className="mt-1 break-all text-sm font-medium">{profile.email}</p>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Protected by OTP verification</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              A verification code is sent to your existing email before the new
              address can be applied.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
