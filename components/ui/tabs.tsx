"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  // ✅ square container, slightly nicer look
  "group/tabs-list inline-flex w-full items-center justify-between " +
    "bg-background shadow-sm overflow-hidden",
  {
    variants: {
      variant: {
        default: "p-0",
        line: "border-0 bg-transparent shadow-none p-0",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // ✅ base (square)
        "relative inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold",
        "text-foreground transition-all duration-200",
        "border-r last:border-r-0 border-border",
        "hover:bg-muted/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",

        // ✅ active = gradient + shine
        "data-[state=active]:text-primary-foreground",
        "data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary",
        "data-[state=active]:shadow-inner",

        // shine overlay on active
        "data-[state=active]:before:content-[''] data-[state=active]:before:absolute data-[state=active]:before:inset-0",
        "data-[state=active]:before:bg-[radial-gradient(circle_at_30%_20%,rgba(224, 127, 0, 0.35),transparent_55%)]",
        "data-[state=active]:before:pointer-events-none",

        // ✅ active bottom indicator (subtle)
        "data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0",
        "data-[state=active]:after:bottom-0 data-[state=active]:after:h-[3px] data-[state=active]:after:bg-white/30",

        // line variant: underline style
        "group-data-[variant=line]/tabs-list:border-0 group-data-[variant=line]/tabs-list:shadow-none",
        "group-data-[variant=line]/tabs-list:bg-transparent",
        "group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "group-data-[variant=line]/tabs-list:data-[state=active]:text-primary",
        "group-data-[variant=line]/tabs-list:after:absolute group-data-[variant=line]/tabs-list:after:left-3 group-data-[variant=line]/tabs-list:after:right-3",
        "group-data-[variant=line]/tabs-list:after:bottom-0 group-data-[variant=line]/tabs-list:after:h-[2px]",
        "group-data-[variant=line]/tabs-list:after:bg-transparent",
        "group-data-[variant=line]/tabs-list:data-[state=active]:after:bg-primary",

        // vertical
        "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start",

        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none",
        "data-[state=inactive]:hidden data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-1",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
