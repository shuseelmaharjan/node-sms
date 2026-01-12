"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SettingsSidebar } from "./SettingsSidebar";

export function SettingsMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-xl px-3 text-xs sm:h-10 sm:text-sm"
        >
          <Menu size={16} />
          Menu
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-70 p-0 sm:w-96">
        <div className="border-b px-2 py-0">
          <SheetHeader>
            <SheetTitle className="text-base">Settings</SheetTitle>
          </SheetHeader>
        </div>

        <div>
          <SettingsSidebar
            onItemClick={() => setOpen(false)}
            showHeader={false}
            compact
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
