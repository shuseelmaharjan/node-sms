import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "w-full min-w-0 rounded-md border border-input bg-transparent shadow-xs outline-none",
        "file:inline-flex file:border-0 file:bg-transparent file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "dark:bg-input/30",

        // Mobile-first sizing (better for phones)
        "h-10 px-3 py-2 text-sm",
        "file:h-8 file:text-sm",

        // Desktop (keep close to your current look)
        "sm:h-9 sm:py-1 sm:text-base",
        "md:text-sm",

        // Focus + invalid
        "transition-[color,box-shadow,border-color] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",

        className
      )}
      {...props}
    />
  );
}

export { Input };
