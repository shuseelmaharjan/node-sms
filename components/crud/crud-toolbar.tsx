"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CrudToolbar({
  search,
  onSearch,
  onCreate,
  createLabel = "Add",
}: {
  search: string;
  onSearch: (v: string) => void;
  onCreate: () => void;
  createLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search..."
        className="w-full sm:w-[280px]"
      />
      <Button onClick={onCreate}>{createLabel}</Button>
    </div>
  );
}
