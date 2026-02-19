"use client";

import * as React from "react";
import Image from "next/image";
import { Mail, Phone, User2 } from "lucide-react";

import { Badge, normalizeVariant } from "@/components/ui/badge";
import { ImageViewer } from "@/components/media/ImageViewer";
import { NepalAddressLine } from "@/components/address/NepalAddressLine";
import { cn } from "@/lib/utils";
import { formatDateShort, toSentenceCase } from "@/utils/text-utils";

import type { StudentShortInfo } from "../types/confirm-enrollment.types";

export function StudentShortInfoPanel(props: { student: StudentShortInfo }) {
  const student = props.student;

  const photoDoc = React.useMemo(() => {
    const docs = student?.profile?.documents ?? [];
    return docs.find((d) => d.document_type === "photo")?.file ?? null;
  }, [student]);

  const avatarUrl =
    student?.profile_picture?.file_url || photoDoc?.file_url || "";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border bg-muted">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={student.full_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <User2 className="h-6 w-6" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold truncate">
                {student.full_name}
              </h2>
              <Badge
                variant={normalizeVariant(student.role)}
                label={toSentenceCase(student.role)}
              />
              <Badge
                variant={normalizeVariant(student.status)}
                label={toSentenceCase(student.status)}
              />
            </div>

            <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="truncate">{student.phone || "-"}</span>
              </div>
              {student.email ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{student.email}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <SectionCard title="Profile Information">
        <KVGrid
          items={[
            ["Username", student.username || "-"],
            ["First name", student.first_name || "-"],
            ["Middle name", student.middle_name || "-"],
            ["Last name", student.last_name || "-"],
            ["Gender", toSentenceCase(student.profile?.gender ?? "") || "-"],
            ["Blood group", student.profile?.blood_group ?? "-"],
            ["Nationality", student.profile?.nationality ?? "-"],
            ["Religion", student.profile?.religion ?? "-"],
            ["Mother tongue", student.profile?.mother_tongue ?? "-"],
            ["DOB (AD)", formatDateShort(student.profile?.date_of_birth_in_ad) || "-"],
            ["DOB (BS)", student.profile?.date_of_birth_in_bs ?? "-"],
          ]}
        />
      </SectionCard>

      <SectionCard title="Addresses">
        {student.profile?.addresses?.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {student.profile.addresses.map((a) => (
              <div key={a.id} className="rounded-lg border p-3">
                <div className="font-medium">{toSentenceCase(a.address_type)}</div>

                <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  <div>
                    {a.tole || a.street || "-"}
                    {a.ward_no ? `, Ward ${a.ward_no}` : ""}
                  </div>
                  <div>
                    <NepalAddressLine
                      municipality={a.municipality}
                      district={a.district}
                      province={a.province}
                    />
                  </div>
                  <div>
                    {a.country || "-"}
                    {a.postal_code ? ` • ${a.postal_code}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No addresses.</div>
        )}
      </SectionCard>

      <SectionCard title="Guardians">
        {student.profile?.guardians?.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {student.profile.guardians.map((g) => (
              <div key={g.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{g.full_name || "-"}</div>
                  {g.relation ? (
                    <Badge variant="other" label={toSentenceCase(g.relation)} />
                  ) : null}
                </div>

                <div className="mt-2 text-sm text-muted-foreground space-y-1">
                  {g.phone ? <div>Phone: {g.phone}</div> : null}
                  {g.email ? <div>Email: {g.email}</div> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No guardians.</div>
        )}
      </SectionCard>

      <SectionCard title="Documents">
        {student.profile?.documents?.length ? (
          <div className="grid grid-cols-1 gap-3">
            {student.profile.documents.map((d) => {
              const f = d.file;
              return (
                <div key={d.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">
                        {toSentenceCase(d.document_type)}
                      </div>
                      {d.remarks ? (
                        <div className="text-xs text-muted-foreground truncate">
                          Remarks: {d.remarks}
                        </div>
                      ) : null}
                    </div>

                    {f?.file_url ? (
                      <ImageViewer
                        file={{
                          id: f.id,
                          file_url: f.file_url,
                          download_url: (f as any).download_url,
                          file_type: f.file_type,
                          original_name: f.original_name,
                          size_bytes: f.size_bytes,
                          is_temporary: f.is_temporary,
                          meta: f.meta,
                          uploaded_at: f.uploaded_at,
                          document_type: d.document_type,
                        }}
                        thumbSize={52}
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground">No file</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No documents.</div>
        )}
      </SectionCard>
    </div>
  );
}

/* small local helpers */

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function KVGrid({
  items,
  monoKeys,
}: {
  items: Array<[string, React.ReactNode]>;
  monoKeys?: string[];
}) {
  return (
    <div className="grid grid-cols-1 gap-3 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[130px_1fr] gap-2">
          <div className="text-muted-foreground">{k}</div>
          <div className={cn("break-words font-medium", monoKeys?.includes(k) && "font-mono text-xs")}>
            {v}
          </div>
        </div>
      ))}
    </div>
  );
}
