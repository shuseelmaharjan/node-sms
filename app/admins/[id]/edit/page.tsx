"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AdminStepShell } from "@/modules/admins/components/AdminStepShell";
import { PersonalStep } from "@/modules/admins/components/steps/PersonalStep";
import { SchoolStep } from "@/modules/admins/components/steps/SchoolStep";
import { ClientStep } from "@/modules/admins/components/steps/ClientStep";

import {
  updateAdminPersonal,
  updateAdminSchool,
  updateAdminClient,
  fetchAdminDetail,
  fetchAdmins,
} from "@/modules/admins/api/admins.api";

import { adminsKeys } from "@/modules/admins/admins.keys";

// shadcn Tabs (Radix)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";

type Tab = "personal" | "school" | "client";

function setSearchParams(
  sp: URLSearchParams,
  next: Record<string, string | null | undefined>
) {
  const p = new URLSearchParams(sp.toString());
  Object.entries(next).forEach(([k, v]) => {
    if (!v) p.delete(k);
    else p.set(k, v);
  });
  return p.toString();
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminEditPage({ params }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const sp = useSearchParams();
  
  const [userId, setUserId] = React.useState<string | null>(null);
  const [showAllAdmins, setShowAllAdmins] = React.useState(false);

  React.useEffect(() => {
    params.then(({ id }) => setUserId(id));
  }, [params]);

  const tab = ((sp.get("tab") as Tab) ?? "personal") satisfies Tab;
  const schoolId = sp.get("schoolId");

  // Query to fetch all existing admins for reference
  const allAdminsQuery = useQuery({
    queryKey: adminsKeys.list({ q: "", pageIndex: 0, pageSize: 100, ordering: "" }),
    queryFn: () =>
      fetchAdmins({
        page: 1,
        page_size: 100,
        search: undefined,
        ordering: undefined,
      }),
    enabled: showAllAdmins,
  });

  // Fetch admin detail for editing
  const adminDetailQ = useQuery({
    queryKey: adminsKeys.detail(userId!),
    queryFn: () => fetchAdminDetail(userId!),
    enabled: Boolean(userId),
  });

  const gotoTab = (t: Tab, patch?: Record<string, string | null | undefined>) => {
    const qs = setSearchParams(sp, { tab: t, ...patch });
    router.replace(`/admins/${userId}/edit?${qs}`);
  };

  // ---- Mutations ----

  const personalMut = useMutation({
    mutationFn: async (values: any) => {
      if (!userId) throw new Error("Missing userId");
      return updateAdminPersonal(userId, values);
    },
    onSuccess: () => {
      if (userId) {
        qc.invalidateQueries({ queryKey: adminsKeys.all });
        qc.invalidateQueries({ queryKey: adminsKeys.detail(userId) });
        gotoTab("school", { schoolId: adminDetailQ.data?.owned_schools?.[0]?.id });
      }
    },
  });

  const schoolMut = useMutation({
    mutationFn: async (values: any) => {
      const currentSchoolId = schoolId || adminDetailQ.data?.owned_schools?.[0]?.id;
      if (!currentSchoolId) throw new Error("Missing schoolId");
      return updateAdminSchool(currentSchoolId, values);
    },
    onSuccess: () => {
      if (userId) {
        qc.invalidateQueries({ queryKey: adminsKeys.all });
        qc.invalidateQueries({ queryKey: adminsKeys.detail(userId) });
      }
      gotoTab("client");
    },
  });

  const clientMut = useMutation({
    mutationFn: async (values: any) => {
      if (!userId) throw new Error("Missing userId");
      const currentSchoolId = schoolId || adminDetailQ.data?.owned_schools?.[0]?.id;
      return updateAdminClient(userId, { 
        user_id: userId, 
        school_id: currentSchoolId, 
        ...values 
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminsKeys.all });
      if (userId) await qc.invalidateQueries({ queryKey: adminsKeys.detail(userId) });
      router.replace("/admins");
    },
  });

  // Prefill data from existing admin
  const personalInitial = adminDetailQ.data
    ? {
        phone: adminDetailQ.data.phone,
        email: adminDetailQ.data.email,
        first_name: adminDetailQ.data.first_name,
        middle_name: adminDetailQ.data.middle_name ?? "",
        last_name: adminDetailQ.data.last_name,
      }
    : null;

  const schoolInitial = (() => {
    const s = adminDetailQ.data?.owned_schools?.[0];
    if (!s) return null;
    return {
      code: s.code,
      name: s.name,
      address: s.address,
      phone: s.phone,
      email: s.email,
      is_active: s.is_active,
      logo_file_id: s.logo_file?.id ?? null,
      logo_file_url: s.logo_file?.file_url ?? null,
      pan_number: s.pan_number ?? "",
      registration_number: s.registration_number ?? "",
      pan_doc_id: s.pan_document_file?.id ?? null,
      pan_doc_url: s.pan_document_file?.file_url ?? null,
      reg_doc_id: s.registration_document_file?.id ?? null,
      reg_doc_url: s.registration_document_file?.file_url ?? null,
    };
  })();

  if (!userId || adminDetailQ.isLoading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  if (adminDetailQ.isError || !adminDetailQ.data) {
    return <div className="container mx-auto py-6">Failed to load admin details.</div>;
  }

  const currentSchoolId = schoolId || adminDetailQ.data.owned_schools?.[0]?.id;

  return (
    <AdminStepShell
      title="Edit Admin"
      description="Update admin information in 3 steps"
      mode="edit"
      active={tab}
      userId={userId}
      schoolId={currentSchoolId}
      toPersonal={() => gotoTab("personal")}
      toSchool={() => gotoTab("school")}
      toClient={() => gotoTab("client")}
    >
      <div className="space-y-6">
        {/* Toggle button to show all admins */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Admin Information</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllAdmins(!showAllAdmins)}
          >
            {showAllAdmins ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide All Admins
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View All Admins
              </>
            )}
          </Button>
        </div>

        {/* All Admins List */}
        {showAllAdmins && (
          <Card>
            <CardHeader>
              <CardTitle>All Admins</CardTitle>
            </CardHeader>
            <CardContent>
              {allAdminsQuery.isLoading ? (
                <div>Loading all admins...</div>
              ) : allAdminsQuery.isError ? (
                <div>Failed to load admins.</div>
              ) : (
                <div className="grid gap-3 max-h-64 overflow-y-auto">
                  {allAdminsQuery.data?.results?.map((admin) => (
                    <div
                      key={admin.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        admin.id === userId ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-medium">
                          {admin.first_name} {admin.middle_name ? `${admin.middle_name} ` : ""}{admin.last_name}
                          {admin.id === userId && (
                            <Badge variant="default" className="ml-2">Current</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {admin.email} • {admin.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{admin.role}</Badge>
                        <Badge variant={admin.profile_status === "complete" ? "default" : "outline"}>
                          {admin.profile_status}
                        </Badge>
                      </div>
                    </div>
                  )) ?? []}
                  {allAdminsQuery.data?.results?.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No admins found.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Form */}
        <Tabs value={tab} onValueChange={(v) => gotoTab(v as Tab)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="school">School</TabsTrigger>
            <TabsTrigger value="client">Client</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" forceMount>
            <PersonalStep
              mode="edit"
              initial={personalInitial}
              resetKey={`personal-edit-${userId}`}
              submitLoading={personalMut.isPending}
              onSubmit={async (values) => personalMut.mutateAsync(values)}
            />
          </TabsContent>

          <TabsContent value="school" forceMount>
            <SchoolStep
              mode="edit"
              initial={schoolInitial}
              resetKey={`school-edit-${userId}-${currentSchoolId}`}
              externallyBlocked={false}
              submitLoading={schoolMut.isPending}
              onSubmit={async (values) => schoolMut.mutateAsync(values)}
            />
          </TabsContent>

          <TabsContent value="client" forceMount>
            <ClientStep
              mode="edit"
              initial={adminDetailQ.data}
              resetKey={`client-edit-${userId}`}
              submitLoading={clientMut.isPending}
              onSubmit={async (values) => clientMut.mutateAsync(values)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminStepShell>
  );
}