"use client";

import * as React from "react";
import { FileText, Pencil, Plus } from "lucide-react";

import { NepalAddressLine } from "@/components/address/NepalAddressLine";
import { ImageViewer } from "@/components/media/ImageViewer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateShort, toSentenceCase } from "@/utils/text-utils";

import type {
  ManagedAddress,
  ManagedAddressType,
  ManagedDocument,
  ManagedGuardian,
  ManagedProfile,
  PersonalInfo,
} from "../../types/management-profile.types";
import type { Student360Detail } from "../../types/student360.types";
import { AddressEditModal } from "../profile-edit/address-edit-modal";
import { DocumentEditModal } from "../profile-edit/document-edit-modal";
import { GuardianEditModal } from "../profile-edit/guardian-edit-modal";
import { HealthEditModal } from "../profile-edit/health-edit-modal";
import { PersonalInfoEditModal } from "../profile-edit/personal-info-edit-modal";
import { HealthCard } from "./health-card";
import { InfoRow } from "./shared";

type ModalState =
  | { type: "personal-info" }
  | { type: "address"; addressType: ManagedAddressType }
  | { type: "guardian"; guardianId: string }
  | { type: "document"; documentId?: string }
  | { type: "health" }
  | null;

type Props = {
  studentId: string;
  managementUserId: string;
  data: Student360Detail;
  managedProfile: ManagedProfile | null;
};

function fallbackPersonalInfo(data: Student360Detail): PersonalInfo {
  return {
    id: data.profile?.id,
    date_of_birth_in_ad: data.profile?.date_of_birth_in_ad ?? "",
    date_of_birth_in_bs: data.profile?.date_of_birth_in_bs ?? "",
    gender: data.profile?.gender ?? "",
    blood_group: data.profile?.blood_group ?? "",
    nationality: data.profile?.nationality ?? "",
    religion: data.profile?.religion ?? "",
    mother_tongue: data.profile?.mother_tongue ?? "",
    citizenship_no: data.profile?.citizenship_no ?? "",
    pan_no: data.profile?.pan_no ?? "",
    created_at: data.profile?.created_at,
    updated_at: data.profile?.updated_at,
  };
}

function fallbackAddress(
  data: Student360Detail,
  type: ManagedAddressType
): ManagedAddress | null {
  const address = data.profile?.addresses?.find(
    (item) => item.address_type === type
  );

  return address ? { ...address } : null;
}

export function Student360ProfileSection({
  studentId,
  managementUserId,
  data,
  managedProfile,
}: Props) {
  const [modal, setModal] = React.useState<ModalState>(null);
  const editable = Boolean(managementUserId && managedProfile);

  const personalInfo =
    managedProfile?.personal_info ?? fallbackPersonalInfo(data);

  const addresses = React.useMemo(
    () =>
      (["permanent", "temporary", "current"] as const).map((type) => ({
        type,
        address:
          managedProfile?.[`${type}_address`] ?? fallbackAddress(data, type),
      })),
    [data, managedProfile]
  );

  const guardians: ManagedGuardian[] =
    managedProfile?.guardians ?? data.profile?.guardians ?? [];

  const documents: ManagedDocument[] =
    managedProfile?.documents ??
    (data.profile?.documents ?? []).map((document) => ({
      ...document,
      issued_date: document.issued_date ?? "",
      expiry_date: document.expiry_date ?? "",
    }));

  const health = managedProfile?.health ?? data.profile?.student_other_info ?? null;

  const selectedAddress =
    modal?.type === "address"
      ? addresses.find((item) => item.type === modal.addressType)?.address ?? null
      : null;

  const selectedGuardian =
    modal?.type === "guardian"
      ? guardians.find((item) => item.id === modal.guardianId) ?? null
      : null;

  const selectedDocument =
    modal?.type === "document" && modal.documentId
      ? documents.find((item) => item.id === modal.documentId) ?? null
      : null;

  return (
    <>
      <Card className="rounded-xl border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Summary, addresses, guardians, documents and health information.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="guardians">Guardians</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4 space-y-3">
              <SectionActions
                title="Personal summary"
                actionLabel="Edit summary"
                disabled={!editable}
                onAction={() => setModal({ type: "personal-info" })}
              />

              <InfoRow
                k="DOB (AD)"
                v={formatDateShort(personalInfo.date_of_birth_in_ad) || "-"}
              />
              <InfoRow
                k="DOB (BS)"
                v={personalInfo.date_of_birth_in_bs || "-"}
              />
              <InfoRow
                k="Gender"
                v={toSentenceCase(personalInfo.gender) || "-"}
              />
              <InfoRow k="Blood group" v={personalInfo.blood_group || "-"} />
              <InfoRow k="Nationality" v={personalInfo.nationality || "-"} />
              <InfoRow k="Religion" v={personalInfo.religion || "-"} />
              <InfoRow
                k="Mother tongue"
                v={personalInfo.mother_tongue || "-"}
              />
              {personalInfo.citizenship_no || personalInfo.pan_no ? (
                <>
                  <InfoRow
                    k="Citizenship no."
                    v={personalInfo.citizenship_no || "-"

                    }
                  />
                  <InfoRow k="PAN no." v={personalInfo.pan_no || "-"} />
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="addresses" className="mt-4 space-y-3">
              {addresses
                .filter(({ type }) => type !== "current")
                .map(({ type, address }) => (
                  <Card
                    key={type}
                    className="rounded-xl border bg-gradient-to-br from-muted/40 to-background py-1"
                  >
                    <CardContent className="px-4 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-semibold">
                            {toSentenceCase(type)}

                            {address?.is_primary ? (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                Primary
                              </span>
                            ) : null}
                          </div>

                          {address ? (
                            <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              <div>
                                {address.tole || address.street || "-"}
                                {address.ward_no
                                  ? `, Ward ${address.ward_no}`
                                  : ""}
                              </div>

                              <NepalAddressLine
                                municipality={address.municipality}
                                district={address.district}
                                province={address.province}
                              />

                              <div>
                                {address.country || "-"}
                                {address.postal_code
                                  ? ` • ${address.postal_code}`
                                  : ""}
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-muted-foreground">
                              No {type} address has been recorded.
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!editable}
                          onClick={() =>
                            setModal({
                              type: "address",
                              addressType: type,
                            })
                          }
                        >
                          {address ? (
                            <Pencil className="mr-2 h-4 w-4" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}

                          {address ? "Edit" : "Add"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="guardians" className="mt-4">
              {guardians.length ? (
                <div className="grid grid-cols-1 gap-3">
                  {guardians.map((guardian) => (
                    <Card
                      key={guardian.id}
                      className="rounded-xl border bg-gradient-to-br from-muted/40 to-background py-0"
                    >
                      <CardContent className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="truncate font-semibold">
                                {guardian.full_name || "-"}
                              </div>
                              {guardian.is_primary ? (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                  Primary
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {toSentenceCase(guardian.relation)}
                              {guardian.occupation
                                ? ` • ${guardian.occupation}`
                                : ""}
                            </div>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              {guardian.phone ? (
                                <div>Phone: {guardian.phone}</div>
                              ) : null}
                              {guardian.email ? (
                                <div>Email: {guardian.email}</div>
                              ) : null}
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={!editable}
                            onClick={() =>
                              setModal({
                                type: "guardian",
                                guardianId: guardian.id,
                              })
                            }
                            aria-label={`Edit ${guardian.full_name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No guardians.
                </div>
              )}

            </TabsContent>

            <TabsContent value="documents" className="mt-4 space-y-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  disabled={!editable}
                  onClick={() => setModal({ type: "document" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add document
                </Button>
              </div>

              {documents.length ? (
                <div className="grid grid-cols-1 gap-3">
                  {documents.map((document) => {
                    const file = document.file;

                    return (
                      <Card
                        key={document.id}
                        className="rounded-xl border bg-gradient-to-br from-muted/40 to-background py-1"
                      >
                        <CardContent className="px-4 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold">
                                {toSentenceCase(document.document_type)}
                              </div>
                              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                {document.issued_by ? (
                                  <div>Issued by: {document.issued_by}</div>
                                ) : null}
                                {document.issued_date ? (
                                  <div>
                                    Issued: {formatDateShort(document.issued_date)}
                                  </div>
                                ) : null}
                                {document.expiry_date ? (
                                  <div>
                                    Expires: {formatDateShort(document.expiry_date)}
                                  </div>
                                ) : null}
                                {document.remarks ? (
                                  <div className="line-clamp-2">
                                    Remarks: {document.remarks}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {file?.file_url ? (
                                <ImageViewer
                                  file={{
                                    id: file.id,
                                    file_url: file.file_url,
                                    download_url: file.download_url,
                                    file_type: file.file_type,
                                    original_name: file.original_name,
                                    size_bytes: file.size_bytes,
                                    is_temporary: file.is_temporary,
                                    meta: file.meta ?? undefined,
                                    uploaded_at: file.uploaded_at,
                                  }}
                                  thumbSize={64}
                                />
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  No file
                                </div>
                              )}

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={!editable}
                                onClick={() =>
                                  setModal({
                                    type: "document",
                                    documentId: document.id,
                                  })
                                }
                                aria-label={`Edit ${document.document_type}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No documents.
                </div>
              )}
            </TabsContent>

            <TabsContent value="health" className="mt-4 space-y-3">
              <SectionActions
                title="Health information"
                actionLabel="Edit health"
                disabled={!editable}
                onAction={() => setModal({ type: "health" })}
              />
              <HealthCard info={health} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <PersonalInfoEditModal
        open={modal?.type === "personal-info"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        studentId={studentId}
        userId={managementUserId}
        role={managedProfile?.user.role}
        personalInfo={managedProfile?.personal_info ?? null}
      />

      <AddressEditModal
        open={modal?.type === "address"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        studentId={studentId}
        userId={managementUserId}
        addressType={
          modal?.type === "address" ? modal.addressType : "permanent"
        }
        address={selectedAddress}
      />

      <GuardianEditModal
        open={modal?.type === "guardian"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        studentId={studentId}
        userId={managementUserId}
        guardian={selectedGuardian}
      />

      <DocumentEditModal
        open={modal?.type === "document"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        studentId={studentId}
        userId={managementUserId}
        document={selectedDocument}
      />

      <HealthEditModal
        open={modal?.type === "health"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        studentId={studentId}
        userId={managementUserId}
        health={health}
      />
    </>
  );
}

function SectionActions({
  title,
  actionLabel,
  disabled,
  onAction,
}: {
  title: string;
  actionLabel: string;
  disabled: boolean;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium">{title}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onAction}
      >
        <Pencil className="mr-2 h-4 w-4" />
        {actionLabel}
      </Button>
    </div>
  );
}
