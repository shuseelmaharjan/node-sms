"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
};

export function DatePickerField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  placeholder = "Pick a date",
  required = false,
}: Props<T>) {
  const id = React.useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = Boolean(fieldState.error);
        const dateValue = field.value ? new Date(field.value as string) : undefined;

        return (
          <div className="space-y-2">
            <Label htmlFor={id}>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id={id}
                  variant="outline"
                  disabled={disabled}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateValue && "text-muted-foreground",
                    hasError && "border-destructive focus-visible:ring-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateValue ? format(dateValue, "PPP") : <span>{placeholder}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateValue}
                  onSelect={(date) => {
                    if (date) {
                      // Format as YYYY-MM-DD for the input
                      const formatted = format(date, "yyyy-MM-dd");
                      field.onChange(formatted);
                    } else {
                      field.onChange("");
                    }
                  }}
                  disabled={disabled}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {hasError && fieldState.error?.message && (
              <p className="text-sm text-destructive">{fieldState.error.message}</p>
            )}
          </div>
        );
      }}
    />
  );
}
