"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type ControllerRenderProps,
  type ControllerFieldState,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  fromYear?: number;
  toYear?: number;
};

type ViewMode = "day" | "month" | "year";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const startOfDecade = (year: number) => Math.floor(year / 10) * 10;

function DatePickerInner<T extends FieldValues>(props: {
  id: string;
  label: string;
  required: boolean;
  disabled?: boolean;
  placeholder: string;
  fromYear: number;
  toYear: number;
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
}) {
  const { id, label, required, disabled, placeholder, fromYear, toYear, field, fieldState } = props;

  const hasError = Boolean(fieldState.error);

  const selectedDate = field.value ? new Date(field.value as string) : undefined;

  const [view, setView] = React.useState<ViewMode>("day");
  const [displayMonth, setDisplayMonth] = React.useState<Date>(() => selectedDate ?? new Date());

  React.useEffect(() => {
    if (selectedDate) setDisplayMonth(selectedDate);
  }, [field.value]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayYear = displayMonth.getFullYear();
  const displayMonthIndex = displayMonth.getMonth();

  const [decadeStart, setDecadeStart] = React.useState(() => startOfDecade(displayYear));
  React.useEffect(() => {
    setDecadeStart(startOfDecade(displayYear));
  }, [displayYear]);

  const clampYear = (y: number) => Math.min(Math.max(y, fromYear), toYear);

  const setMonthAndKeepDay = (year: number, monthIndex: number) => {
    const currentDay = selectedDate?.getDate() ?? 1;
    const next = new Date(year, monthIndex, currentDay);
    if (next.getMonth() !== monthIndex) setDisplayMonth(new Date(year, monthIndex, 1));
    else setDisplayMonth(next);
  };

  const goPrev = () => {
    if (view === "day") setDisplayMonth(new Date(displayYear, displayMonthIndex - 1, 1));
    if (view === "month") setDisplayMonth(new Date(clampYear(displayYear - 1), displayMonthIndex, 1));
    if (view === "year") setDecadeStart((d) => Math.max(d - 10, startOfDecade(fromYear)));
  };

  const goNext = () => {
    if (view === "day") setDisplayMonth(new Date(displayYear, displayMonthIndex + 1, 1));
    if (view === "month") setDisplayMonth(new Date(clampYear(displayYear + 1), displayMonthIndex, 1));
    if (view === "year") setDecadeStart((d) => Math.min(d + 10, startOfDecade(toYear)));
  };

  const headerTitle =
    view === "day" ? (
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2 text-sm font-medium"
          onClick={() => setView("month")}
          disabled={disabled}
        >
          {MONTHS[displayMonthIndex]}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2 text-sm font-medium"
          onClick={() => setView("year")}
          disabled={disabled}
        >
          {displayYear}
        </Button>
      </div>
    ) : view === "month" ? (
      <Button
        type="button"
        variant="ghost"
        className="h-8 px-2 text-sm font-medium"
        onClick={() => setView("year")}
        disabled={disabled}
      >
        {displayYear}
      </Button>
    ) : (
      <div className="h-8 px-2 text-sm font-medium flex items-center">
        {decadeStart} – {decadeStart + 9}
      </div>
    );

  const header = (
    <div className="flex items-center justify-between border-b px-3 py-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={goPrev}
        disabled={
          disabled ||
          (view === "month" && displayYear <= fromYear) ||
          (view === "year" && decadeStart <= startOfDecade(fromYear))
        }
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {headerTitle}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={goNext}
        disabled={
          disabled ||
          (view === "month" && displayYear >= toYear) ||
          (view === "year" && decadeStart >= startOfDecade(toYear))
        }
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const body =
    view === "day" ? (
      <Calendar
        mode="single"
        month={displayMonth}
        onMonthChange={setDisplayMonth}
        selected={selectedDate}
        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
        disabled={disabled}
        initialFocus
        showOutsideDays={false} 
        hideCaption
        hideNavigation
      />
    ) : view === "month" ? (
      <div className="p-3">
        <div className="grid grid-cols-3 grid-rows-4 gap-2">
          {MONTHS.map((m, idx) => {
            const isSelected = idx === displayMonthIndex;
            return (
              <Button
                key={m}
                type="button"
                variant={isSelected ? "default" : "ghost"}
                className={cn("h-9 rounded-md text-sm", !isSelected && "hover:bg-accent")}
                onClick={() => {
                  setMonthAndKeepDay(displayYear, idx);
                  setView("day");
                }}
                disabled={disabled}
              >
                {m}
              </Button>
            );
          })}
        </div>
      </div>
    ) : (
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, i) => decadeStart + i)
            .filter((y) => y >= fromYear && y <= toYear)
            .map((y) => {
              const isSelected = y === displayYear;
              return (
                <Button
                  key={y}
                  type="button"
                  variant={isSelected ? "default" : "ghost"}
                  className={cn("h-9 rounded-md text-sm", !isSelected && "hover:bg-accent")}
                  onClick={() => {
                    setDisplayMonth(new Date(y, displayMonthIndex, 1));
                    setView("month");
                  }}
                  disabled={disabled}
                >
                  {y}
                </Button>
              );
            })}
        </div>
      </div>
    );

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs sm:text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      <Popover
        onOpenChange={(open) => {
          if (open) setView("day");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
              hasError && "border-destructive focus-visible:ring-destructive"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[270px] p-0" align="start">
          {header}
          {body}
        </PopoverContent>
      </Popover>

      {hasError && fieldState.error?.message ? (
        <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
          {fieldState.error.message}
        </p>
      ) : (
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug invisible">&nbsp;</p>
      )}
    </div>
  );
}

export function DatePickerField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  placeholder = "Pick a date",
  required = false,
  fromYear = 1950,
  toYear = new Date().getFullYear() + 10,
}: Props<T>) {
  const id = React.useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DatePickerInner<T>
          id={id}
          label={label}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          fromYear={fromYear}
          toYear={toYear}
          field={field}
          fieldState={fieldState}
        />
      )}
    />
  );
}
