"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

import { profileApi, profileQueryKey } from "../api/profile.api";
import { EmailSummaryCard } from "./profile/EmailSummaryCard";
import { PersonalInfoSummaryCard } from "./profile/PersonalInfoSummaryCard";
import { ProfileHeaderCard } from "./profile/ProfileHeaderCard";
import { BasicInfoModal } from "./profile/modals/BasicInfoModal";
import { EmailChangeModal } from "./profile/modals/EmailChangeModal";
import { ProfilePictureModal } from "./profile/modals/ProfilePictureModal";

type ProfileModal = "basic-info" | "profile-picture" | "email" | null;

export function ProfileSettings() {
  const [activeModal, setActiveModal] = useState<ProfileModal>(null);

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: profileApi.getMe,
    staleTime: 60_000,
    retry: 1,
  });

  if (profileQuery.isLoading) {
    return <ProfileSettingsSkeleton />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PageShell
        title="Profile settings"
        description="Manage your personal information and account identity."
      >
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="min-w-0 flex-1">
              <h2 className="font-medium">Unable to load your profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Check your connection and try again.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                disabled={profileQuery.isFetching}
                onClick={() => void profileQuery.refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  const profile = profileQuery.data;

  return (
    <PageShell
      title="Profile settings"
      description="Review your account details and edit only the information you need."
    >
      <div className="space-y-6">
        <ProfileHeaderCard
          profile={profile}
          onChangePicture={() => setActiveModal("profile-picture")}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <PersonalInfoSummaryCard
            profile={profile}
            onEdit={() => setActiveModal("basic-info")}
          />
          <EmailSummaryCard
            profile={profile}
            onEdit={() => setActiveModal("email")}
          />
        </div>
      </div>

      <BasicInfoModal
        open={activeModal === "basic-info"}
        onOpenChange={(open) => setActiveModal(open ? "basic-info" : null)}
        profile={profile}
      />

      <ProfilePictureModal
        open={activeModal === "profile-picture"}
        onOpenChange={(open) =>
          setActiveModal(open ? "profile-picture" : null)
        }
        profile={profile}
      />

      <EmailChangeModal
        open={activeModal === "email"}
        onOpenChange={(open) => setActiveModal(open ? "email" : null)}
        profile={profile}
      />
    </PageShell>
  );
}

export default ProfileSettings;

function ProfileSettingsSkeleton() {
  return (
    <PageShell
      title="Profile settings"
      description="Review your account details and edit only the information you need."
    >
      <div className="space-y-6" aria-busy="true" aria-label="Loading profile">
        <div className="h-56 animate-pulse rounded-2xl border bg-muted/30" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl border bg-muted/30" />
          <div className="h-64 animate-pulse rounded-2xl border bg-muted/30" />
        </div>
      </div>
    </PageShell>
  );
}
