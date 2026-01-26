"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames, type DayButton } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,

  // ✅ NEW
  hideNavigation = false,
  hideCaption = false,

  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  hideNavigation?: boolean;
  hideCaption?: boolean;
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        // removed w-fit behavior by making root/months/table full width via classNames below
        "bg-background group/calendar p-3 [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        // ✅ fill width (fix right gap)
        root: cn("w-full", defaultClassNames.root),
        months: cn("w-full flex flex-col relative", defaultClassNames.months),
        month: cn("w-full flex flex-col gap-4", defaultClassNames.month),

        // ✅ Hide built-in nav row when asked
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          hideNavigation && "hidden",
          defaultClassNames.nav
        ),

        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next
        ),

        // ✅ caption row
        month_caption: cn(
          "flex items-center justify-center h-8 w-full px-8",
          hideCaption && "hidden",
          defaultClassNames.month_caption
        ),

        // ✅ dropdown row (also hide)
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-8 gap-1.5",
          hideCaption && "hidden",
          defaultClassNames.dropdowns
        ),

        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("absolute bg-popover inset-0 opacity-0", defaultClassNames.dropdown),

        caption_label: cn(
          "select-none font-medium",
          hideCaption && "hidden",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),

        // ✅ table fills width
        table: cn("w-full border-collapse table-fixed"),

        // ✅ use grid so all 7 columns align & fill width perfectly (no gap)
        weekdays: cn("grid grid-cols-7 w-full", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md text-center font-normal text-[0.8rem] select-none",
          "last:text-destructive", // ✅ Saturday header red
          defaultClassNames.weekday
        ),

        // ✅ each week is a 7-col grid; also color Saturday dates red
        week: cn(
          "grid grid-cols-7 w-full mt-0.5",
          "[&>*:nth-child(7)]:text-destructive", // ✅ Saturday column red
          defaultClassNames.week
        ),

        week_number_header: cn("select-none w-8", defaultClassNames.week_number_header),
        week_number: cn("text-[0.8rem] select-none text-muted-foreground", defaultClassNames.week_number),

        // ✅ allow cells to size naturally with grid (avoid aspect-square causing spacing issues)
        day: cn("p-0 text-center select-none", defaultClassNames.day),

        range_start: cn("rounded-l-md bg-accent", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),

        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),

        outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),

        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...p }) => (
          <div data-slot="calendar" ref={rootRef} className={cn("w-full", className)} {...p} />
        ),
        Chevron: ({ className, orientation, ...p }) => {
          if (orientation === "left") return <ChevronLeftIcon className={cn("size-4", className)} {...p} />;
          if (orientation === "right") return <ChevronRightIcon className={cn("size-4", className)} {...p} />;
          return <ChevronDownIcon className={cn("size-4", className)} {...p} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...p }) => (
          <td {...p}>
            <div className="flex size-8 items-center justify-center text-center">{children}</div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        // ✅ ensure each cell fills its grid column
        "h-9 w-full rounded-md font-normal",
        "hover:bg-accent hover:text-accent-foreground",

        // selected/range states
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",

        // focus ring
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50",

        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
