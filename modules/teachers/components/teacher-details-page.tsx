"use client";

import * as React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, User2 } from "lucide-react";

import { api } from "@/api";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge, normalizeVariant } from "@/components/ui/badge";

import { ImageViewer } from "@/components/media/ImageViewer";
import type { TeacherDetail } from "../types/teacher.types";
import { toSentenceCase } from "@/utils/text-utils";
import { formatDateShort, formatDateTime } from "@/utils/text-utils";

const DETAIL_URL = (id: string) => `/api/v1/teachers/${id}/`;

export function TeacherDetailsPage({ id }: { id: string }) {
    const router = useRouter();

    const detailQuery = useQuery<TeacherDetail>({
        queryKey: ["teachers", "detail", id],
        queryFn: async () => (await api.get<TeacherDetail>(DETAIL_URL(id))).data,
    });

    const data = detailQuery.data;

    // helper: pick profile photo from documents if profile_picture is null
    const photoDoc = React.useMemo(() => {
        const docs = data?.profile?.documents ?? [];
        return docs.find((d) => d.document_type === "photo")?.file ?? null;
    }, [data]);

    const avatarUrl =
        data?.profile_picture?.file_url ||
        photoDoc?.file_url ||
        "";

    return (
        <PageShell
            title="Teacher Details"
            description="Profile, specialization, addresses and documents."
            actions={
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
            }
        >
            {detailQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
            ) : detailQuery.isError ? (
                <div className="text-sm text-destructive">Failed to load details.</div>
            ) : !data ? (
                <div className="text-sm text-muted-foreground">No data.</div>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                    {/* MAIN */}
                    <div className="space-y-6">
                        {/* Header summary card */}
                        <section className="rounded-lg border p-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-full border bg-muted">
                                        {avatarUrl ? (
                                            <Image
                                                src={avatarUrl}
                                                alt={data.full_name}
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
                                                {data.full_name}
                                            </h2>
                                            <Badge variant={normalizeVariant(data.role)} label={toSentenceCase(data.role)} />
                                            <Badge variant={normalizeVariant(data.status)} label={toSentenceCase(data.status)} />

                                        </div>

                                        <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                <span className="truncate">{data.phone || "-"}</span>
                                            </div>
                                            {data.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    <span className="truncate">{data.email || "-"}</span>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {/* Show teacher level */}
                                    <Badge variant="other" label={`Level: ${data.specialization?.teacher_level ?? "-"}`} />

                                    <Badge
                                        variant="other"
                                        label={`Subjects: ${data.specialization?.subjects?.length ?? 0}`}
                                    />


                                </div>
                            </div>
                        </section>

                        {/* Profile */}
                        <SectionCard title="Profile Information">
                            <KVGrid
                                items={[
                                    ["First name", data.first_name || "-"],
                                    ["Middle name", data.middle_name || "-"],
                                    ["Last name", data.last_name || "-"],
                                    ["Gender", toSentenceCase(data.profile?.gender ?? "") || "-"],
                                    ["Blood group", data.profile?.blood_group ?? "-"],
                                    ["Nationality", data.profile?.nationality ?? "-"],
                                    ["Religion", data.profile?.religion ?? "-"],
                                    ["Mother tongue", data.profile?.mother_tongue ?? "-"],
                                    ["DOB (AD)", formatDateShort(data.profile?.date_of_birth_in_ad) || "-"],
                                    ["DOB (BS)", data.profile?.date_of_birth_in_bs ?? "-"],
                                    ["Citizenship no", data.profile?.citizenship_no ?? "-"],
                                    ["PAN no", data.profile?.pan_no ?? "-"],
                                ]}
                            />

                            <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                <InfoItem label="Profile created" value={formatDateTime(data.profile?.created_at)} />
                            </div>
                        </SectionCard>

                        {/* Addresses */}
                        <SectionCard title="Addresses">
                            {data.profile?.addresses?.length ? (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {data.profile.addresses.map((a) => (
                                        <div key={a.id} className="rounded-lg border p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-medium">
                                                    {toSentenceCase(a.address_type)}
                                                </div>
                                                {a.is_primary ? <Badge variant="other" label="Primary" /> : null}
                                            </div>

                                            <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                                <div>
                                                    {a.tole || a.street || "-"}
                                                    {a.ward_no ? `, Ward ${a.ward_no}` : ""}
                                                </div>
                                                <div>
                                                    {a.municipality || "-"}, {a.district || "-"}, {a.province || "-"}
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

                        {/* Documents */}
                        <SectionCard title="Documents">
                            {data.profile?.documents?.length ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-1 lg:grid-cols-1">
                                    {data.profile.documents.map((d) => {
                                        const f = d.file;
                                        return (
                                            <div key={d.id} className="rounded-lg border p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="font-medium">
                                                            {toSentenceCase(d.document_type)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {f?.original_name ?? "-"}
                                                        </div>
                                                        {d.issued_by ? <div className="text-xs text-muted-foreground truncate">Issued by: {d.issued_by}</div> : null}
                                                        {d.remarks ? <div className="text-xs text-muted-foreground truncate">Remarks: {d.remarks}</div> : null}
                                                    </div>

                                                    {/* Thumbnail + viewer */}
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
                                                            }}
                                                            thumbSize={52}
                                                        />
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground">No file</div>
                                                    )}
                                                </div>

                                                {/* Doc meta */}
                                                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                                                    <div>Uploaded At: {formatDateShort(d.issued_date) ?? "-"}</div>
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

                    {/* SIDE PANEL */}
                    <aside className="space-y-6">

                        <SectionCard title="Specialization">
                            <KVGrid
                                items={[
                                    ["Teacher level", data.specialization?.teacher_level ?? "-"],
                                ]}
                                monoKeys={["Teacher level ID"]}
                            />

                            {data.specialization?.subjects?.length ? (
                                <div className="mt-3 space-y-2">
                                    {data.specialization.subjects.map((s) => (
                                        <div
                                            key={s.id}
                                            className="flex items-start justify-between gap-3 rounded-md border p-2"
                                        >
                                            <div className="min-w-0">
                                                <div className="font-medium leading-5 truncate">
                                                    {s.name}{" "}
                                                    <span className="text-xs text-muted-foreground">({s.code})</span>
                                                </div>
                                                {s.description ? (
                                                    <div className="text-xs text-muted-foreground line-clamp-2">
                                                        {s.description}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <Badge
                                                variant={normalizeVariant(s.status)}
                                                label={toSentenceCase(s.status)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-3 text-sm text-muted-foreground">No subjects.</div>
                            )}
                        </SectionCard>

                    </aside>
                </div>
            )}
        </PageShell>
    );
}

/* ---------- small reusable UI helpers ---------- */

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

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-sm font-medium break-words">{value}</div>
        </div>
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

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}
