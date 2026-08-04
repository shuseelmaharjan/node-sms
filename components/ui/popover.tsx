"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

function Popover(
  props: React.ComponentProps<typeof PopoverPrimitive.Root>
) {
  return (
    <PopoverPrimitive.Root
      data-slot="popover"
      {...props}
    />
  );
}

function PopoverTrigger(
  props: React.ComponentProps<typeof PopoverPrimitive.Trigger>
) {
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      {...props}
    />
  );
}

function PopoverAnchor(
  props: React.ComponentProps<typeof PopoverPrimitive.Anchor>
) {
  return (
    <PopoverPrimitive.Anchor
      data-slot="popover-anchor"
      {...props}
    />
  );
}

type PopoverContentProps =
  React.ComponentPropsWithoutRef<
    typeof PopoverPrimitive.Content
  > & {
    /**
     * Render through Radix Portal.
     *
     * Use false when the popover is inside a modal/dialog to prevent
     * focus-lock, pointer-event and responsive positioning conflicts.
     */
    portalled?: boolean;

    /**
     * Optional custom portal container.
     */
    portalContainer?: HTMLElement | null;
  };

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      align = "center",
      sideOffset = 4,
      portalled = true,
      portalContainer,
      ...props
    },
    ref
  ) => {
    const content = (
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none",
          "data-[state=open]:animate-in",
          "data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0",
          "data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95",
          "data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    );

    if (!portalled) {
      return content;
    }

    return (
      <PopoverPrimitive.Portal
        container={portalContainer ?? undefined}
      >
        {content}
      </PopoverPrimitive.Portal>
    );
  }
);

PopoverContent.displayName =
  PopoverPrimitive.Content.displayName;

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
};