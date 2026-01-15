"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Monitor, Smartphone, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { useAuth } from "@/lib/auth";
import { sessionsApi } from "../api/session.api";
import { SESSIONS_KEY } from "../queries/session.queries";
import type { Session } from "../schema/session.schema";
import { LoadingState } from "@/components/ui/LoadingState";

function formatMaybeDate(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

function clientIcon(type?: string) {
    const t = (type ?? "").toLowerCase();
    if (t.includes("mobile") || t.includes("android") || t.includes("ios")) return Smartphone;
    return Monitor;
}

function SessionStatusPill({ active }: { active: boolean }) {
    return (
        <span
            className={[
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-muted-foreground/20 bg-muted/40 text-muted-foreground",
            ].join(" ")}
        >
            <span
                className={[
                    "mr-1.5 inline-block h-2 w-2 rounded-full",
                    active ? "bg-emerald-500" : "bg-muted-foreground/50",
                ].join(" ")}
            />
            {active ? "Active" : "Revoked"}
        </span>
    );
}

function buildSessionTitle(s: Session) {
    const device = s.device_name || "Unknown device";
    const os = [s.os_name, s.os_version].filter(Boolean).join(" ");
    const app = s.app_version ? `App ${s.app_version}` : "";
    return [device, os, app].filter(Boolean).join(" • ");
}

function sortSessions(sessions: Session[]) {
    return [...sessions].sort((a, b) => {
        // current first
        if (a.is_current !== b.is_current) return a.is_current ? -1 : 1;
        // then active
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        // then most recent
        const aTime = new Date(a.last_seen_at || a.created_at).getTime();
        const bTime = new Date(b.last_seen_at || b.created_at).getTime();
        return bTime - aTime;
    });
}

function CurrentPill() {
    return (
        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            This device
        </span>
    );
}

export function SessionsSettings() {
    const queryClient = useQueryClient();
    const { logoutWithoutConfirmation } = useAuth();

    const sessionsQuery = useQuery({
        queryKey: SESSIONS_KEY,
        queryFn: sessionsApi.list,
    });

    const sessions = useMemo(() => {
        const list = sessionsQuery.data?.sessions ?? [];
        return sortSessions(list);
    }, [sessionsQuery.data]);

    // dialogs state
    const [revokeOneOpen, setRevokeOneOpen] = useState(false);
    const [revokeOthersOpen, setRevokeOthersOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    const revokeOneMutation = useMutation({
        mutationFn: async (sessionId: string) => sessionsApi.revokeOne(sessionId),
        onSuccess: async (_, sessionId) => {
            await queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
            setRevokeOneOpen(false);
            setSelectedSession(null);
            
            // Check if the revoked session was the current session
            const revokedSession = sessions.find(s => s.id === sessionId);
            if (revokedSession?.is_current) {
                // Current session was revoked, trigger logout
                console.log('Current session was revoked, logging out...');
                setTimeout(() => {
                    logoutWithoutConfirmation();
                }, 1000); // Small delay to let UI update
            }
        },
    });

    const revokeOthersMutation = useMutation({
        mutationFn: async () => sessionsApi.revokeOthers(),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
            setRevokeOthersOpen(false);
        },
    });

    const anyOtherActive = useMemo(() => {
        return sessions.some((s) => s.is_active && !s.is_current);
    }, [sessions]);


    if (sessionsQuery.isLoading) {
        return (
            <LoadingState title="Checking authentication…" subtitle="Please wait" variant="page" />
        );
    }

    if (sessionsQuery.isError) {
        return (
            <LoadingState title="Failed to load sessions" subtitle="Please try again later" variant="page" />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold sm:text-xl">Sessions</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage the devices where your account is signed in.
                    </p>
                </div>

                <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setRevokeOthersOpen(true)}
                    disabled={!anyOtherActive || revokeOthersMutation.isPending}
                >
                    <Trash2 size={16} className="mr-2" />
                    Revoke other sessions
                </Button>

            </div>

            {/* List */}
            <div className="rounded-2xl border bg-card">
                <div className="border-b px-4 py-3 sm:px-6 sm:py-4">
                    <p className="text-sm font-medium">Active & recent sessions</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Revoking a session signs that device out.
                    </p>
                </div>

                <div className="divide-y">
                    {sessions.length === 0 ? (
                        <div className="p-4 sm:p-6">
                            <p className="text-sm text-muted-foreground">No sessions found.</p>
                        </div>
                    ) : (
                        sessions.map((s) => {
                            const Icon = clientIcon(s.client_type);
                            const title = buildSessionTitle(s);
                            const ip = s.ip_address || "—";
                            const lastSeen = formatMaybeDate(s.last_seen_at);
                            const created = formatMaybeDate(s.created_at);

                            return (
                                <div
                                    key={s.id}
                                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6"
                                >
                                    <div className="flex gap-3">
                                        <span className="grid h-10 w-10 place-items-center rounded-xl border bg-muted/30">
                                            <Icon size={18} />
                                        </span>

                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-semibold whitespace-normal break-words [overflow-wrap:anywhere]">
                                                    {title || "Session"}
                                                </p>

                                                {s.is_current ? <CurrentPill /> : null}
                                                <SessionStatusPill active={s.is_active} />

                                                <span className="text-xs text-muted-foreground">({s.client_type})</span>
                                            </div>


                                            <div className="text-xs text-muted-foreground space-y-0.5">
                                                <p className="whitespace-normal break-words [overflow-wrap:anywhere]">
                                                    IP: <span className="font-medium text-foreground/80">{ip}</span>
                                                </p>
                                                <p>
                                                    Last seen: <span className="font-medium text-foreground/80">{lastSeen}</span>
                                                </p>
                                                <p>
                                                    Created: <span className="font-medium text-foreground/80">{created}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <Button
                                            variant="destructive"
                                            className="w-full sm:w-auto"
                                            disabled={s.is_current || !s.is_active || revokeOneMutation.isPending}
                                            onClick={() => {
                                                setSelectedSession(s);
                                                setRevokeOneOpen(true);
                                            }}
                                        >
                                            <Trash2 size={16} className="mr-2" />
                                            Revoke
                                        </Button>

                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Confirm revoke one */}
            <ConfirmDeleteDialog
                open={revokeOneOpen}
                onOpenChange={(v) => {
                    setRevokeOneOpen(v);
                    if (!v) setSelectedSession(null);
                }}
                title="Revoke this session?"
                description="This will sign out this device."
                loading={revokeOneMutation.isPending}
                onConfirm={async () => {
                    if (!selectedSession?.id) return;
                    await revokeOneMutation.mutateAsync(selectedSession.id);
                }}
            />

            {/* Confirm revoke others */}
            <ConfirmDeleteDialog
                open={revokeOthersOpen}
                onOpenChange={setRevokeOthersOpen}
                title="Revoke other sessions?"
                description="This will sign out all other devices except the one you're currently using."
                loading={revokeOthersMutation.isPending}
                onConfirm={async () => {
                    await revokeOthersMutation.mutateAsync();
                }}
            />
        </div>
    );
}

export default SessionsSettings;
