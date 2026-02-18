import * as React from "react";
import { FileText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageViewer } from "@/components/media/ImageViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateShort, formatDateTime, toSentenceCase } from "@/utils/text-utils";

import type { Student360Detail } from "../../types/student360.types";
import { HealthCard } from "./health-card";
import { InfoRow} from "./shared";
import { NepalAddressLine } from "@/components/address/NepalAddressLine";

export function Student360ProfileSection({ data }: { data: Student360Detail }) {
  return (
    <Card className="border-1 shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Profile
        </CardTitle>
        <CardDescription>
          Summary, addresses, guardians, documents & health info.
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
            <InfoRow k="DOB (AD)" v={formatDateShort(data.profile?.date_of_birth_in_ad) || "-"} />
            <InfoRow k="DOB (BS)" v={data.profile?.date_of_birth_in_bs || "-"} />
            <InfoRow k="Gender" v={toSentenceCase(data.profile?.gender ?? "") || "-"} />
            <InfoRow k="Blood group" v={data.profile?.blood_group ?? "-"} />
            <InfoRow k="Nationality" v={data.profile?.nationality ?? "-"} />
            <InfoRow k="Religion" v={data.profile?.religion ?? "-"} />
            <InfoRow k="Mother tongue" v={data.profile?.mother_tongue ?? "-"} />
          </TabsContent>

          <TabsContent value="addresses" className="mt-4">
            {data.profile?.addresses?.length ? (
              <div className="grid grid-cols-1 gap-3">
                {data.profile.addresses.map((a) => (
                  <Card
                    key={a.id}
                    className="border bg-gradient-to-br from-muted/40 to-background py-1 rounded-xl"
                  >
                    <CardContent className="px-4 py-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold">
                            {toSentenceCase(a.address_type)}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground leading-relaxed">
                            <div>
                              {a.tole || a.street || "-"}
                              {a.ward_no ? `, Ward ${a.ward_no}` : ""}
                            </div>

                            <NepalAddressLine
                              municipality={a.municipality}
                              district={a.district}
                              province={a.province}
                            />
                            <div>
                              {a.country || "-"}
                              {a.postal_code ? ` • ${a.postal_code}` : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No addresses.</div>
            )}
          </TabsContent>

          <TabsContent value="guardians" className="mt-4">
            {data.profile?.guardians?.length ? (
              <div className="grid grid-cols-1 gap-3">
                {data.profile.guardians.map((g) => (
                  <Card
                    key={g.id}
                    className="border bg-gradient-to-br from-muted/40 to-background py-0 rounded-xl"
                  >
                    <CardContent className="px-4 py-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{g.full_name || "-"}</div>
                          <div className="text-xs text-muted-foreground">
                            {toSentenceCase(g.relation)} {g.occupation ? `• ${g.occupation}` : ""}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground space-y-1">
                            {g.phone && (<div>Phone: {g.phone || "-"}</div>)}
                            {g.email && (<div>Email: {g.email || "-"}</div>)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No guardians.</div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            {data.profile?.documents?.length ? (
              <div className="grid grid-cols-1 gap-3">
                {data.profile.documents.map((d) => {
                  const f = d.file;
                  return (
                    <Card
                      key={d.id}
                      className="border bg-gradient-to-br from-muted/40 to-background py-1 rounded-xl"
                    >
                      <CardContent className="px-4 py-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold">
                              {toSentenceCase(d.document_type)}
                            </div>


                            <div className="mt-2 text-xs text-muted-foreground space-y-1">
                              {d.issued_by ? <div>Issued by: {d.issued_by}</div> : null}
                              {d.remarks ? (
                                <div className="truncate">Remarks: {d.remarks}</div>
                              ) : null}
                            </div>
                          </div>

                          {f?.file_url ? (
                            <ImageViewer
                              file={{
                                id: f.id,
                                file_url: f.file_url,
                                download_url: (f as { download_url?: string | null }).download_url,
                                file_type: f.file_type,
                                original_name: f.original_name,
                                size_bytes: f.size_bytes,
                                is_temporary: f.is_temporary,
                                meta: f.meta,
                                uploaded_at: f.uploaded_at,
                              }}
                              thumbSize={64}
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground">No file</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No documents.</div>
            )}
          </TabsContent>

          <TabsContent value="health" className="mt-4">
            <HealthCard info={data.profile?.student_other_info} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
