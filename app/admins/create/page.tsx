"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AdminStepShell } from "@/modules/admins/components/AdminStepShell";
import { PersonalStep } from "@/modules/admins/components/steps/PersonalStep";
import { SchoolStep } from "@/modules/admins/components/steps/SchoolStep";
import { ClientStep } from "@/modules/admins/components/steps/ClientStep";

import {
  createPersonal,
  updatePersonal,
  createSchool,
  updateSchool,
  createClient,
  updateClient,
  getPersonal,
  getSchool,
  getClient,
  fetchAdminDetail,
} from "@/modules/admins/api/admins.api";

import { adminsKeys } from "@/modules/admins/admins.keys";

// shadcn Tabs (Radix)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";

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

export default function AdminCreatePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const sp = useSearchParams();
  
  const tab = ((sp.get("tab") as Tab) ?? "personal") satisfies Tab;
  const userId = sp.get("userId");
  const schoolId = sp.get("schoolId");
  
  const [showExistingAdmins, setShowExistingAdmins] = React.useState(false);

  // Data fetching queries
  const personalQuery = useQuery({
    queryKey: ["personal-info", userId],
    queryFn: () => getPersonal(userId!),
    enabled: Boolean(userId),
    retry: false,
  });

  const schoolQuery = useQuery({
    queryKey: ["school-info", schoolId],
    queryFn: () => getSchool(schoolId!),
    enabled: Boolean(schoolId),
    retry: false,
  });

  // Fetch admin detail to get owned school info if userId exists but no schoolId
  const adminDetailQuery = useQuery({
    queryKey: adminsKeys.detail(userId),
    queryFn: () => fetchAdminDetail(userId!),
    enabled: Boolean(userId) && !schoolId,
    retry: false,
  });

  // Get effective schoolId from URL param or owned school
  const effectiveSchoolId = schoolId || adminDetailQuery.data?.owned_schools?.[0]?.id;

  // Redirect to personal tab if trying to access school/client without proper IDs
  React.useEffect(() => {
    if (tab === "school" && !userId) {
      router.replace("/admins/create?tab=personal");
    } else if (tab === "client" && (!userId || !effectiveSchoolId)) {
      const params = new URLSearchParams();
      params.set("tab", "school");
      if (userId) params.set("userId", userId);
      router.replace(`/admins/create?${params.toString()}`);
    }
  }, [tab, userId, effectiveSchoolId, router]);

  const gotoTab = (t: Tab, patch?: Record<string, string | null | undefined>) => {
    const qs = setSearchParams(sp, { tab: t, ...patch });
    router.replace(`/admins/create?${qs}`);
  };

  const clientQuery = useQuery({
    queryKey: ["client-info", userId],
    queryFn: () => getClient(userId!),
    enabled: Boolean(userId),
    retry: false,
  });

  // Mutations
  const personalMut = useMutation({
    mutationFn: async (values: any) => {
      if (userId) return updatePersonal(userId, values);
      return createPersonal(values);
    },
    onSuccess: (res: any) => {
      const newUserId = userId ?? res?.user_id;
      if (newUserId) {
        qc.invalidateQueries({ queryKey: adminsKeys.all });
        qc.invalidateQueries({ queryKey: ["personal-info", newUserId] });
        gotoTab("school", { userId: newUserId });
      }
    },
  });

  const schoolMut = useMutation({
    mutationFn: async (values: any) => {
      if (!userId) throw new Error("Missing userId");
      if (effectiveSchoolId) return updateSchool(effectiveSchoolId, values);
      return createSchool({ owner_id: userId, ...values });
    },
    onSuccess: (res: any) => {
      const newSchoolId = effectiveSchoolId ?? res?.school_id;
      if (newSchoolId && userId) {
        qc.invalidateQueries({ queryKey: adminsKeys.all });
        qc.invalidateQueries({ queryKey: ["school-info", newSchoolId] });
        qc.invalidateQueries({ queryKey: adminsKeys.detail(userId) });
        gotoTab("client", { userId, schoolId: newSchoolId });
      }
    },
  });

  const clientMut = useMutation({
    mutationFn: async (values: any) => {
      if (!userId || !effectiveSchoolId) throw new Error("Missing userId/schoolId");
      
      // Check if client record exists by looking at query result
      const hasClientRecord = clientQuery.isSuccess && clientQuery.data;
      if (hasClientRecord) {
        return updateClient(userId, { user_id: userId, school_id: effectiveSchoolId, ...values });
      }
      return createClient({ user_id: userId, school_id: effectiveSchoolId, ...values });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminsKeys.all });
      if (userId) await qc.invalidateQueries({ queryKey: ["client-info", userId] });
      router.replace("/admins");
    },
  });

  // Prepare initial data
  const personalInitial = personalQuery.isSuccess ? {
    phone: personalQuery.data?.phone || "",
    email: personalQuery.data?.email || "",
    first_name: personalQuery.data?.first_name || "",
    middle_name: personalQuery.data?.middle_name || "",
    last_name: personalQuery.data?.last_name || "",
  } : null;

  const schoolInitial = schoolQuery.isSuccess ? {
    code: schoolQuery.data?.code || "",
    name: schoolQuery.data?.name || "",
    address: schoolQuery.data?.address || "",
    phone: schoolQuery.data?.phone || "",
    email: schoolQuery.data?.email || "",
    is_active: schoolQuery.data?.is_active ?? true,
    logo_file_id: schoolQuery.data?.logo_file?.id || null,
    logo_file_url: schoolQuery.data?.logo_file?.file_url || null,
    pan_number: schoolQuery.data?.pan_number ?? "",
    registration_number: schoolQuery.data?.registration_number ?? "",
    pan_doc_id: schoolQuery.data?.pan_document_file?.id || null,
    pan_doc_url: schoolQuery.data?.pan_document_file?.file_url || null,
    reg_doc_id: schoolQuery.data?.registration_document_file?.id || null,
    reg_doc_url: schoolQuery.data?.registration_document_file?.file_url || null,
  } : adminDetailQuery.isSuccess && adminDetailQuery.data?.owned_schools?.[0] ? (() => {
    const s = adminDetailQuery.data.owned_schools[0];
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
  })() : null;

  const clientInitial = clientQuery.isSuccess ? clientQuery.data : null;

  // Loading state
  const isLoading = 
    (userId && personalQuery.isLoading) ||
    (effectiveSchoolId && schoolQuery.isLoading) ||
    (userId && !effectiveSchoolId && adminDetailQuery.isLoading) ||
    (userId && tab === "client" && clientQuery.isLoading);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p>Loading existing data...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminStepShell
      title={userId ? "Edit Admin" : "Create Admin"}
      description={userId ? "Update admin information in 3 steps" : "Create admin in 3 steps"}
      mode={userId ? "edit" : "create"}
      active={tab}
      userId={userId}
      schoolId={schoolId}
      toPersonal={() => gotoTab("personal")}
      toSchool={() => gotoTab("school")}
      toClient={() => gotoTab("client")}
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <Tabs value={tab} onValueChange={(v) => gotoTab(v as Tab)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="school" disabled={!userId}>
              School {!userId && <AlertTriangle className="h-3 w-3 ml-1" />}
            </TabsTrigger>
            <TabsTrigger value="client" disabled={!userId || !effectiveSchoolId}>
              Client {(!userId || !effectiveSchoolId) && <AlertTriangle className="h-3 w-3 ml-1" />}
            </TabsTrigger>
          </TabsList>

          {/* Conditional rendering - only render active tab */}
          {tab === "personal" && (
            <TabsContent value="personal">
              <PersonalStep
                mode={userId ? "edit" : "create"}
                initial={personalInitial}
                resetKey={`personal-${userId ?? "new"}`}
                submitLoading={personalMut.isPending}
                onSubmit={async (values) => personalMut.mutateAsync(values)}
              />
            </TabsContent>
          )}

          {tab === "school" && userId && (
            <TabsContent value="school">
              <SchoolStep
                mode={effectiveSchoolId ? "edit" : "create"}
                initial={schoolInitial}
                resetKey={`school-${userId}-${effectiveSchoolId ?? "new"}`}
                externallyBlocked={false}
                submitLoading={schoolMut.isPending}
                onSubmit={async (values) => schoolMut.mutateAsync(values)}
              />
            </TabsContent>
          )}

          {tab === "client" && userId && effectiveSchoolId && (
            <TabsContent value="client">
              <ClientStep
                mode={clientQuery.isSuccess && clientQuery.data ? "edit" : "create"}
                initial={clientInitial}
                resetKey={`client-${userId}-${effectiveSchoolId}`}
                submitLoading={clientMut.isPending}
                onSubmit={async (values) => clientMut.mutateAsync(values)}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminStepShell>
  );
}
