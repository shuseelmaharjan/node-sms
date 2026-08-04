"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";

import { cn } from "@/lib/utils";
import {
  Button,
  buttonVariants,
} from "@/components/ui/button";

type CalendarProps =
  React.ComponentProps<typeof DayPicker> & {
    buttonVariant?: React.ComponentProps<
      typeof Button
    >["variant"];
    hideNavigation?: boolean;
    hideCaption?: boolean;
  };

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  hideNavigation = false,
  hideCaption = false,
  ...props
}: CalendarProps) {
  const defaultClassNames =
    getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn(
        "group/calendar bg-background p-3",
        "[[data-slot=card-content]_&]:bg-transparent",
        "[[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", {
            month: "short",
          }),
        ...formatters,
      }}
      classNames={{
        root: cn(
          "w-fit",
          defaultClassNames.root
        ),

        months: cn(
          "relative flex w-fit flex-col",
          defaultClassNames.months
        ),

        month: cn(
          "relative flex w-fit flex-col gap-4",
          defaultClassNames.month
        ),

        nav: cn(
          "absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between",
          hideNavigation && "hidden",
          defaultClassNames.nav
        ),

        button_previous: cn(
          buttonVariants({
            variant: buttonVariant,
          }),
          "h-8 w-8 select-none p-0",
          "aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),

        button_next: cn(
          buttonVariants({
            variant: buttonVariant,
          }),
          "h-8 w-8 select-none p-0",
          "aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),

        month_caption: cn(
          "relative flex h-8 w-full items-center justify-center px-10",
          hideCaption && "hidden",
          defaultClassNames.month_caption
        ),

        caption_label: cn(
          "select-none text-sm font-medium",
          hideCaption && "hidden",
          captionLayout !== "label" &&
            "flex h-8 items-center gap-1 rounded-md px-2",
          defaultClassNames.caption_label
        ),

        dropdowns: cn(
          "flex h-8 items-center justify-center gap-1.5 text-sm font-medium",
          hideCaption && "hidden",
          defaultClassNames.dropdowns
        ),

        dropdown_root: cn(
          "relative rounded-md border border-input shadow-xs",
          "has-focus:border-ring",
          "has-focus:ring-[3px]",
          "has-focus:ring-ring/50",
          defaultClassNames.dropdown_root
        ),

        dropdown: cn(
          "absolute inset-0 cursor-pointer opacity-0",
          defaultClassNames.dropdown
        ),

        month_grid: cn(
          "w-full border-collapse",
          defaultClassNames.month_grid
        ),

        weekdays: cn(
          defaultClassNames.weekdays
        ),

        weekday: cn(
          "h-9 w-9 rounded-md text-center",
          "text-[0.8rem] font-normal",
          "text-muted-foreground",
          "last:text-destructive",
          defaultClassNames.weekday
        ),

        week: cn(
          defaultClassNames.week
        ),

        week_number_header: cn(
          "w-9 select-none",
          defaultClassNames.week_number_header
        ),

        week_number: cn(
          "select-none text-[0.8rem] text-muted-foreground",
          defaultClassNames.week_number
        ),

        day: cn(
          "relative h-9 w-9 p-0 text-center",
          defaultClassNames.day
        ),

        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),

        range_middle: cn(
          "rounded-none",
          defaultClassNames.range_middle
        ),

        range_end: cn(
          "rounded-r-md bg-accent",
          defaultClassNames.range_end
        ),

        today: cn(
          "rounded-md bg-accent text-accent-foreground",
          defaultClassNames.today
        ),

        outside: cn(
          "text-muted-foreground opacity-40",
          defaultClassNames.outside
        ),

        disabled: cn(
          "pointer-events-none text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),

        hidden: cn(
          "invisible",
          defaultClassNames.hidden
        ),

        ...classNames,
      }}
      components={{
        Root: ({
          className: rootClassName,
          rootRef,
          ...rootProps
        }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(
              "w-fit",
              rootClassName
            )}
            {...rootProps}
          />
        ),

        Chevron: ({
          className: iconClassName,
          orientation,
          ...iconProps
        }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn(
                  "h-4 w-4",
                  iconClassName
                )}
                {...iconProps}
              />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn(
                  "h-4 w-4",
                  iconClassName
                )}
                {...iconProps}
              />
            );
          }

          return (
            <ChevronDownIcon
              className={cn(
                "h-4 w-4",
                iconClassName
              )}
              {...iconProps}
            />
          );
        },

        DayButton: CalendarDayButton,

        WeekNumber: ({
          children,
          ...weekNumberProps
        }) => (
          <td {...weekNumberProps}>
            <div className="flex h-8 w-8 items-center justify-center text-center">
              {children}
            </div>
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
  const buttonRef =
    React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) {
      buttonRef.current?.focus();
    }
  }, [modifiers.focused]);

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={
        modifiers.range_start
      }
      data-range-end={
        modifiers.range_end
      }
      data-range-middle={
        modifiers.range_middle
      }
      className={cn(
        "h-9 w-9 rounded-md p-0 font-normal",
        "hover:bg-accent hover:text-accent-foreground",

        "data-[selected-single=true]:bg-primary",
        "data-[selected-single=true]:text-primary-foreground",

        "data-[range-middle=true]:bg-accent",
        "data-[range-middle=true]:text-accent-foreground",

        "data-[range-start=true]:bg-primary",
        "data-[range-start=true]:text-primary-foreground",

        "data-[range-end=true]:bg-primary",
        "data-[range-end=true]:text-primary-foreground",

        "focus-visible:ring-2",
        "focus-visible:ring-ring/50",

        modifiers.outside &&
          "text-muted-foreground opacity-40",

        modifiers.disabled &&
          "pointer-events-none opacity-50",

        /**
         * Saturday column.
         * JavaScript day 6 is Saturday.
         */
        day.date.getDay() === 6 &&
          !modifiers.selected &&
          "text-destructive",

        className
      )}
      {...props}
    />
  );
}

export {
  Calendar,
  CalendarDayButton,
};