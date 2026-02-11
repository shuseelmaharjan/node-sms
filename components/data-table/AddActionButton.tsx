// components/data-table/AddActionButton.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export type AddAction =
  | { kind: "link"; href: string; label?: string }
  | { kind: "modal"; onClick: () => void; label?: string };

export function AddActionButton({ add }: { add: AddAction }) {
  const label = add.label ?? "Add";

  if (add.kind === "link") {
    return (
      <Button asChild>
        <Link href={add.href}>
          <Plus className="mr-2 h-4 w-4" />
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button type="button" onClick={add.onClick}>
      <Plus className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
