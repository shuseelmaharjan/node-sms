"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { adminsKeys } from "../admins.keys";
import { fetchAdminDetail } from "../api/admins.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AdminViewPage({ id }: { id: string }) {
  const q = useQuery({
    queryKey: adminsKeys.detail(id),
    queryFn: () => fetchAdminDetail(id),
  });

  if (q.isLoading) return <div className="container mx-auto py-6">Loading…</div>;
  if (q.isError || !q.data)
    return <div className="container mx-auto py-6">Failed to load.</div>;

  const a = q.data;
  const school = a.owned_schools?.[0] ?? null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {a.first_name} {a.middle_name ? `${a.middle_name} ` : ""}{a.last_name}
          </h1>
          <p className="text-muted-foreground">@{a.username}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admins">Back</Link>
          </Button>
          <Button asChild>
            <Link href={`/admins/create?tab=personal&userId=${id}`}>Edit</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Email" value={a.email || "-"} />
            <Row label="Phone" value={a.phone || "-"} />
            <Row
              label="Role"
              value={<Badge variant="secondary">{a.role}</Badge>}
            />
            <Row
              label="Profile"
              value={
                <Badge variant={a.profile_status === "complete" ? "default" : "outline"}>
                  {a.profile_status}
                </Badge>
              }
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle>School</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {school ? (
              <>
                <Row label="Code" value={school.code} />
                <Row label="Name" value={school.name} />
                <Row label="Email" value={school.email} />
                <Row label="Phone" value={school.phone} />
                <Row
                  label="Active"
                  value={
                    <Badge variant={school.is_active ? "default" : "outline"}>
                      {school.is_active ? "active" : "inactive"}
                    </Badge>
                  }
                />
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No school linked.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {a.profile ? (
            <pre className="text-xs rounded border p-3 overflow-auto">
              {JSON.stringify(a.profile, null, 2)}
            </pre>
          ) : (
            <div className="text-sm text-muted-foreground">No client profile.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row(props: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-sm text-muted-foreground">{props.label}</div>
      <div className="text-sm">{props.value}</div>
    </div>
  );
}
