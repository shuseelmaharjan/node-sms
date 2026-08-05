"use client";

import * as React from "react";
import {
  Camera,
  CreditCard,
  IdCard,
  Pencil,
  User2,
} from "lucide-react";

import { ImageViewer } from "@/components/media/ImageViewer";
import { Badge, normalizeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatDateShort,
  formatDateTime,
  toSentenceCase,
} from "@/utils/text-utils";

import type {
  BatchMetaItem,
  Student360Detail,
  WalletRow,
} from "../../types/student360.types";
import type { ManagedProfile } from "../../types/management-profile.types";
import { IdentityEditModal } from "../profile-edit/identity-edit-modal";
import { ProfilePictureEditModal } from "../profile-edit/profile-picture-edit-modal";
import { MiniStat } from "./shared";
import { money } from "./utils";

type Props = {
  studentId: string;
  managementUserId: string;
  data: Student360Detail;
  managedProfile: ManagedProfile | null;
  avatarUrl: string;
  latestWallet: WalletRow | null;
  paidProgress: number;
  batchItems: BatchMetaItem[];
  scopeBatch: string | null;
  onPickBatch: (batchId: string | null) => void;
};

export function Student360HeaderCard({
  studentId,
  managementUserId,
  data,
  managedProfile,
  avatarUrl,
  latestWallet,
}: Props) {
  const [identityOpen, setIdentityOpen] = React.useState(false);
  const [pictureOpen, setPictureOpen] = React.useState(false);

  const user = managedProfile?.user ?? null;
  const editable = Boolean(user && managementUserId);

  const fullName =
    user?.full_name?.trim() ||
    [user?.first_name, user?.middle_name, user?.last_name]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(" ") ||
    data.full_name ||
    "Student";

  const role = user?.role || data.role;
  const status = user?.status || data.status;
  const username = user?.username || data.username;
  const registrationNo =
    user?.registration_no || data.registration_no || "—";

  const profilePictureFile = user?.profile_picture_file ?? null;

  const viewerFile = React.useMemo(() => {
    if (!profilePictureFile?.file_url) {
      return null;
    }

    return {
      id: profilePictureFile.id,
      file_url: profilePictureFile.file_url,
      download_url: profilePictureFile.download_url ?? null,
      file_type: profilePictureFile.file_type,
      original_name:
        profilePictureFile.original_name || `${fullName} profile picture`,
      size_bytes: profilePictureFile.size_bytes,
      is_temporary: profilePictureFile.is_temporary,
      meta: profilePictureFile.meta ?? undefined,
      uploaded_at: profilePictureFile.uploaded_at,
    };
  }, [profilePictureFile, fullName]);

  const latestEnrollment = React.useMemo(() => {
    if (!data.enrollments?.length) {
      return null;
    }

    return [...data.enrollments].sort(
      (first, second) =>
        new Date(second.enrolled_at).getTime() -
        new Date(first.enrolled_at).getTime()
    )[0];
  }, [data.enrollments]);

  return (
    <>
      <Card className="border-0 px-0 py-0 shadow-none">
        <CardContent className="px-0">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] lg:items-start">
            <div className="rounded-xl border bg-background p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div className="relative w-fit shrink-0">
                  {viewerFile ? (
                    <ImageViewer
                      file={viewerFile}
                      thumbSize={80}
                      title={`${fullName} profile picture`}
                      className="rounded-2xl shadow-sm"
                    />
                  ) : avatarUrl ? (
                    <ImageViewer
                      file={{
                        id: user?.id || managementUserId || studentId,
                        file_url: avatarUrl,
                        download_url: avatarUrl,
                        file_type: "image",
                        original_name: `${fullName} profile picture`,
                        size_bytes: undefined,
                        is_temporary: false,
                        meta: undefined,
                        uploaded_at: undefined,
                      }}
                      thumbSize={80}
                      title={`${fullName} profile picture`}
                      className="rounded-2xl shadow-sm"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border bg-muted text-muted-foreground shadow-sm">
                      <User2 className="h-7 w-7" />
                    </div>
                  )}

                  <button
                    type="button"
                    aria-label="Change profile picture"
                    title={
                      editable
                        ? "Change profile picture"
                        : "Editable profile is unavailable"
                    }
                    disabled={!editable}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPictureOpen(true);
                    }}
                    className="absolute -bottom-2 -right-2 z-10 grid h-8 w-8 place-items-center rounded-full border bg-background shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-semibold leading-tight sm:text-2xl">
                      {fullName}
                    </h2>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={!editable}
                      onClick={() => setIdentityOpen(true)}
                      aria-label="Edit student name"
                      title="Edit student name"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {role ? (
                      <Badge
                        variant={normalizeVariant(role)}
                        label={toSentenceCase(role)}
                      />
                    ) : null}

                    {status ? (
                      <Badge
                        variant={normalizeVariant(status)}
                        label={toSentenceCase(status)}
                      />
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {username ? (
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                        @{username}
                      </span>
                    ) : null}

                    {username ? (
                      <span className="text-muted-foreground/60">•</span>
                    ) : null}

                    <span className="inline-flex items-center gap-2 rounded-md bg-muted px-2 py-0.5">
                      <IdCard className="h-4 w-4" />
                      <span>Reg</span>

                      <span className="font-medium text-foreground">
                        {registrationNo}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border bg-muted/10 px-4">
                {latestEnrollment ? (
                  <div className="my-4 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoTile
                      label="Enrolled at"
                      value={formatDateShort(latestEnrollment.enrolled_at)}
                    />

                    <InfoTile
                      label="Batch"
                      value={latestEnrollment.batch?.name || "—"}
                    />

                    <InfoTile
                      label="Batch (BS)"
                      value={`${
                        latestEnrollment.batch?.start_date_bs || "—"
                      } — ${latestEnrollment.batch?.end_date_bs || "—"}`}
                    />

                    <InfoTile
                      label="Class"
                      value={latestEnrollment.academic_class?.name || "—"}
                    />

                    <InfoTile
                      label="Section"
                      value={latestEnrollment.section?.name || "—"}
                    />

                    <InfoTile
                      label="Batch (AD)"
                      value={`${
                        latestEnrollment.batch?.start_date_ad || "—"
                      } — ${latestEnrollment.batch?.end_date_ad || "—"}`}
                    />
                  </div>
                ) : (
                  <div className="my-3 rounded-xl bg-background p-4 text-sm text-muted-foreground">
                    No enrollment data
                  </div>
                )}
              </div>
            </div>

            <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <CreditCard className="h-4 w-4" />
                      Financial Snapshot
                    </div>

                    <div className="mt-1 text-lg font-semibold">
                      {latestWallet ? (
                        <>
                          NPR {money(latestWallet.total_due)}{" "}

                          <span className="text-sm font-normal text-white/70">
                            Due
                          </span>
                        </>
                      ) : (
                        "No wallet"
                      )}
                    </div>

                    <div className="mt-1 text-xs text-white/70">
                      {latestWallet
                        ? `Last updated: ${formatDateTime(
                            latestWallet.updated_at
                          )}`
                        : "—"}
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      document
                        .getElementById("student-finance")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        })
                    }
                    className="h-8"
                  >
                    Record Payment
                  </Button>
                </div>

                {latestWallet ? (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <MiniStat
                      k="Payable"
                      v={`NPR ${money(latestWallet.total_payable)}`}
                    />

                    <MiniStat
                      k="Paid"
                      v={`NPR ${money(latestWallet.total_paid)}`}
                    />

                    <MiniStat
                      k="Discount"
                      v={`NPR ${money(latestWallet.total_discount)}`}
                    />

                    <MiniStat
                      k="Scholarship"
                      v={`NPR ${money(latestWallet.total_scholarship)}`}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <IdentityEditModal
        open={identityOpen}
        onOpenChange={setIdentityOpen}
        studentId={studentId}
        userId={managementUserId}
        user={user}
      />

      <ProfilePictureEditModal
        open={pictureOpen}
        onOpenChange={setPictureOpen}
        studentId={studentId}
        userId={managementUserId}
        user={user}
      />
    </>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-background px-3 py-2.5 ring-1 ring-black/5">
      <div className="text-[11px] text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 truncate text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}