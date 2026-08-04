import { CalendarDays, Camera, IdCard, UserRound } from "lucide-react";

import { ImageViewer } from "@/components/media/ImageViewer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { AccountProfile } from "../../types/profile.types";

function fullName(profile: AccountProfile) {
  return [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
}

function initials(profile: AccountProfile) {
  return `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`
    .toUpperCase()
    .slice(0, 2);
}

function formatJoinedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function ProfileHeaderCard({
  profile,
  onChangePicture,
}: {
  profile: AccountProfile;
  onChangePicture: () => void;
}) {
  const picture = profile.profile_picture_file;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="h-20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />

      <div className="px-4 pb-5 sm:px-6">
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-end gap-4">
            <div className="relative shrink-0">
              {picture ? (
                <ImageViewer
                  file={picture}
                  title="Profile picture"
                  thumbSize={80}
                  className="rounded-2xl border-4 border-card shadow-sm"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-card bg-muted text-xl font-semibold shadow-sm">
                  {initials(profile) || <UserRound className="h-7 w-7" />}
                </div>
              )}

              <button
                type="button"
                onClick={onChangePicture}
                aria-label="Change profile picture"
                className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 pb-1">
              <h2 className="truncate text-lg font-semibold">
                {fullName(profile) || profile.username}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border bg-muted/30 px-2.5 py-1 text-xs font-medium capitalize">
              {profile.role}
            </span>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
                profile.status === "active"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted/30 text-muted-foreground"
              )}
            >
              {profile.status}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onChangePicture}
            >
              <Camera className="mr-2 h-4 w-4" />
              Change photo
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
          <MetaItem icon={UserRound} label="Username" value={profile.username} />
          <MetaItem
            icon={IdCard}
            label="Registration no."
            value={profile.registration_no}
          />
          <MetaItem
            icon={CalendarDays}
            label="Joined"
            value={formatJoinedDate(profile.date_joined)}
          />
        </div>
      </div>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-muted/20">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}
