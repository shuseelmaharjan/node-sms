import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export type BadgeVariant =
  // user status
  | "invited"
  | "active"
  | "suspended"
  | "locked"
  | "deleted"
  | "inactive"
  // student status
  | "applicant"
  | "enrolled"
  | "graduated"
  | "alumni"
  // roles
  | "superadmin"
  | "admin"
  | "principal"
  | "vice_principal"
  | "teacher"
  | "coordinator"
  | "accountant"
  | "cashier"
  | "admissions"
  | "registrar"
  | "librarian"
  | "transport"
  | "hostel"
  | "it"
  | "other"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 overflow-hidden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        invited:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200",
        active:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
        inactive:
          "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200",
        suspended:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200",
        locked:
          "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-200",
        deleted:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",

        applicant:
          "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-200",
        enrolled:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
        graduated:
          "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200",
        alumni:
          "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/40 dark:text-fuchsia-200",

        superadmin:
          "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200",
        admin:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",

        principal:
          "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200",
        vice_principal:
          "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200",

        teacher:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200",
        coordinator:
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200",

        accountant:
          "border-lime-200 bg-lime-50 text-lime-800 dark:border-lime-900/50 dark:bg-lime-950/40 dark:text-lime-200",
        cashier:
          "border-lime-200 bg-lime-50 text-lime-800 dark:border-lime-900/50 dark:bg-lime-950/40 dark:text-lime-200",

        admissions:
          "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-200",
        registrar:
          "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-200",

        librarian:
          "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-200",
        transport:
          "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-200",
        hostel:
          "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/40 dark:text-yellow-200",
        it:
          "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200",

        other:
          "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200",
      } satisfies Record<BadgeVariant, string>,
    },
    defaultVariants: {
      variant: "inactive",
    },
  }
)

function toTitleCase(input: string) {
  // normalize separators
  const s = input.trim().replace(/[\s-]+/g, "_").toLowerCase()

  // acronyms you want uppercase
  const ACRONYMS = new Set(["it"])

  return s
    .split("_")
    .filter(Boolean)
    .map((w) => {
      if (ACRONYMS.has(w)) return w.toUpperCase()
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(" ")
}

function normalizeVariant(value?: string | null): BadgeVariant {
  if (!value) return "other"
  return value
    .toLowerCase()
    .replace(/[\s-]+/g, "_") as BadgeVariant
}

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
    /** If provided, overrides children text formatting */
    label?: string
  }

function Badge({
  className,
  variant,
  asChild = false,
  label,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span"

  const content =
    typeof label === "string"
      ? label
      : typeof children === "string"
        ? toTitleCase(children)
        : children

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {content}
    </Comp>
  )
}

export { Badge, badgeVariants, normalizeVariant, toTitleCase }
