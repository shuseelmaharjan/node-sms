"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";

type Option = { value: string; label: string };

export function ComboboxSelect(props: {
  label: string;
  value: string;                 // selected value
  onChange: (value: string) => void;

  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;

  searchPlaceholder?: string;
  emptyText?: string;
  error?: string | null;
}) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);

  const selected = props.options.find((o) => o.value === props.value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs sm:text-sm font-medium">
        {props.label}
        {props.required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={props.disabled}
            className={cn(
              "w-full justify-between",
              !selected && "text-muted-foreground",
              props.error && "border-destructive focus-visible:ring-destructive/30"
            )}
          >
            {selected ? selected.label : (props.placeholder ?? `Select ${props.label}`)}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command className="w-full">
            <CommandInput placeholder={props.searchPlaceholder ?? `Search ${props.label}...`} />
            <CommandList>
              <CommandEmpty>{props.emptyText ?? "No results found."}</CommandEmpty>
              <CommandGroup>
                {props.options.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.label}
                    onSelect={() => {
                      props.onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        o.value === props.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {props.error ? (
        <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}
