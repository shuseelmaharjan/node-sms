"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Link as LinkIcon, FolderOpen } from "lucide-react";

import { api } from "@/api";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/fields/InputField";
import { FormWizard } from "@/components/form/FormWizard";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  footerGroupSchema,
  footerLinkSchema,
  type FooterGroupValues,
  type FooterLinkValues,
} from "../schema/footer.schema";

type Group = {
  id: string;
  name: string;
  school_id?: string;
  created_at?: string;
  created_by_id?: string;
  updated_at?: string;
  updated_by_id?: string;
};

type Link = {
  id: string;
  name: string;
  url: string;
  footer_group_id: string;
  footer_group_name?: string;
  created_at?: string;
  created_by_id?: string;
  updated_at?: string;
  updated_by_id?: string;
};

function getErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;

  const clean = (msg: unknown) => {
    const s = String(msg ?? "").trim();
    return s.startsWith("__all__:") ? s.replace(/^__all__:\s*/, "") : s;
  };

  if (data?.detail) return clean(data.detail);

  if (Array.isArray(data?.__all__) && data.__all__[0]) {
    return clean(data.__all__[0]);
  }

  if (data && typeof data === "object") {
    for (const [, value] of Object.entries(data)) {
      if (Array.isArray(value) && value[0]) return clean(value[0]);
      if (typeof value === "string") return clean(value);
    }
  }

  return fallback;
}

export function FooterManager() {
  const qc = useQueryClient();

  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null);
  const [groupDialog, setGroupDialog] = React.useState(false);
  const [linkDialog, setLinkDialog] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<Group | null>(null);
  const [editingLink, setEditingLink] = React.useState<Link | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{
    type: "group" | "link";
    id: string;
  } | null>(null);

  const groupsQuery = useQuery({
    queryKey: ["footer-groups"],
    queryFn: async () => {
      const res = await api.get("/api/v1/footer-groups/");
      return res.data.results as Group[];
    },
  });

  const linksQuery = useQuery({
    queryKey: ["footer-links"],
    queryFn: async () => {
      const res = await api.get("/api/v1/footer-links/");
      return res.data.results as Link[];
    },
  });

  const createGroup = useMutation({
    mutationFn: async (v: FooterGroupValues) => {
      const res = await api.post("/api/v1/footer-groups/", v);
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Group created");
      await qc.invalidateQueries({ queryKey: ["footer-groups"] });
      setGroupDialog(false);
      setEditingGroup(null);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to create group"));
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: FooterGroupValues }) => {
      const res = await api.put(`/api/v1/footer-groups/${id}/`, v);
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Group updated");
      await qc.invalidateQueries({ queryKey: ["footer-groups"] });
      setGroupDialog(false);
      setEditingGroup(null);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to update group"));
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/footer-groups/${id}/`);
    },
    onSuccess: async (_, deletedId) => {
      toast.success("Group deleted");
      await qc.invalidateQueries({ queryKey: ["footer-groups"] });
      await qc.invalidateQueries({ queryKey: ["footer-links"] });

      if (selectedGroup?.id === deletedId) {
        setSelectedGroup(null);
      }

      setDeleteTarget(null);
      setEditingGroup(null);
      setGroupDialog(false);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to delete group"));
    },
  });

  const createLink = useMutation({
    mutationFn: async (v: FooterLinkValues) => {
      const res = await api.post("/api/v1/footer-links/", v);
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Link created");
      await qc.invalidateQueries({ queryKey: ["footer-links"] });
      setLinkDialog(false);
      setEditingLink(null);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to create link"));
    },
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: FooterLinkValues }) => {
      const res = await api.put(`/api/v1/footer-links/${id}/`, v);
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Link updated");
      await qc.invalidateQueries({ queryKey: ["footer-links"] });
      setLinkDialog(false);
      setEditingLink(null);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to update link"));
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/footer-links/${id}/`);
    },
    onSuccess: async () => {
      toast.success("Link deleted");
      await qc.invalidateQueries({ queryKey: ["footer-links"] });
      setDeleteTarget(null);
      setEditingLink(null);
      setLinkDialog(false);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to delete link"));
    },
  });

  const groups = groupsQuery.data ?? [];
  const links = linksQuery.data ?? [];

  React.useEffect(() => {
    if (!selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0]);
      return;
    }

    if (selectedGroup) {
      const stillExists = groups.find((g) => g.id === selectedGroup.id);
      if (!stillExists) {
        setSelectedGroup(groups[0] ?? null);
      } else {
        setSelectedGroup(stillExists);
      }
    }
  }, [groups, selectedGroup]);

  const filteredLinks = links.filter(
    (l) => l.footer_group_id === selectedGroup?.id
  );

  const blocked =
    groupsQuery.isFetching ||
    linksQuery.isFetching ||
    createGroup.isPending ||
    updateGroup.isPending ||
    deleteGroup.isPending ||
    createLink.isPending ||
    updateLink.isPending ||
    deleteLink.isPending;

  return (
    <>
      <PageShell
        title="Footer Builder"
        description="Organize footer groups and their links."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Footer Groups</h3>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setEditingGroup(null);
                  setGroupDialog(true);
                }}
                disabled={blocked}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {groupsQuery.isLoading ? (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Loading groups...
                </div>
              ) : groups.length === 0 ? (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  No footer groups yet.
                </div>
              ) : (
                groups.map((g) => {
                  const active = selectedGroup?.id === g.id;

                  return (
                    <button
                      key={g.id}
                      type="button"
                      className={[
                        "w-full rounded-xl border p-3 text-left transition",
                        active
                          ? "border-primary bg-primary/10"
                          : "hover:border-primary/30 hover:bg-muted/40",
                      ].join(" ")}
                      onClick={() => setSelectedGroup(g)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{g.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {links.filter((l) => l.footer_group_id === g.id).length} link(s)
                          </div>
                        </div>

                        <div
                          className="flex shrink-0 gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingGroup(g);
                              setGroupDialog(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            className="text-red-500 hover:text-red-600"
                            onClick={() =>
                              setDeleteTarget({ type: "group", id: g.id })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  <h3 className="truncate font-semibold">
                    {selectedGroup?.name || "Select a group"}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedGroup
                    ? "Manage links for the selected footer group."
                    : "Create and select a group to start adding links."}
                </p>
              </div>

              {selectedGroup ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingLink(null);
                    setLinkDialog(true);
                  }}
                  disabled={blocked}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Link
                </Button>
              ) : null}
            </div>

            {!selectedGroup ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No group selected.
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No links in this group yet.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLinks.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between gap-4 rounded-xl border p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{l.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {l.url}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={blocked}
                        onClick={() => {
                          setEditingLink(l);
                          setLinkDialog(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={blocked}
                        onClick={() =>
                          setDeleteTarget({ type: "link", id: l.id })
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageShell>

      <Dialog
        open={groupDialog}
        onOpenChange={(open) => {
          setGroupDialog(open);
          if (!open) setEditingGroup(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Edit Group" : "Add Group"}
            </DialogTitle>
          </DialogHeader>

          <FormWizard
            schema={footerGroupSchema}
            defaultValues={{ name: editingGroup?.name ?? "" }}
            resetKey={editingGroup ? `group-${editingGroup.id}` : "group-create"}
            blocked={blocked}
            submitLoading={createGroup.isPending || updateGroup.isPending}
            submitLabel={editingGroup ? "Update" : "Create"}
            disableSubmitUntilDirty={Boolean(editingGroup)}
            onSubmit={async (v) => {
              if (editingGroup) {
                await updateGroup.mutateAsync({ id: editingGroup.id, v });
                return;
              }

              await createGroup.mutateAsync(v);
            }}
            render={(m) => (
              <InputField
                label="Group Name"
                required
                {...m.register("name")}
                error={m.formState.errors.name as any}
              />
            )}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={linkDialog}
        onOpenChange={(open) => {
          setLinkDialog(open);
          if (!open) setEditingLink(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Edit Link" : "Add Link"}
            </DialogTitle>
          </DialogHeader>

          <FormWizard
            schema={footerLinkSchema}
            defaultValues={{
              name: editingLink?.name ?? "",
              url: editingLink?.url ?? "",
              footer_group_id:
                editingLink?.footer_group_id ?? selectedGroup?.id ?? "",
            }}
            resetKey={editingLink ? `link-${editingLink.id}` : `link-create-${selectedGroup?.id ?? "none"}`}
            blocked={blocked}
            submitLoading={createLink.isPending || updateLink.isPending}
            submitLabel={editingLink ? "Update" : "Create"}
            disableSubmitUntilDirty={Boolean(editingLink)}
            onSubmit={async (v) => {
              if (editingLink) {
                await updateLink.mutateAsync({ id: editingLink.id, v });
                return;
              }

              await createLink.mutateAsync(v);
            }}
            render={(m) => (
              <div className="space-y-4">
                <InputField
                  label="Link Name"
                  required
                  {...m.register("name")}
                  error={m.formState.errors.name as any}
                />

                <InputField
                  label="URL"
                  required
                  {...m.register("url")}
                  error={m.formState.errors.url as any}
                />
              </div>
            )}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        loading={deleteGroup.isPending || deleteLink.isPending}
        title={
          deleteTarget?.type === "group"
            ? "Delete this group?"
            : "Delete this link?"
        }
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;

          if (deleteTarget.type === "group") {
            await deleteGroup.mutateAsync(deleteTarget.id);
            return;
          }

          await deleteLink.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}