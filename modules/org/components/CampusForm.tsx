"use client";

import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { campusSchema, type CampusFormValues } from "../schemas/campuses.schema";
import type { Campus } from "../types/campuses.types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface CampusFormProps {
  initial?: Campus | null;
  onFormReady: (form: UseFormReturn<CampusFormValues>) => void;
}

export function CampusForm({ initial, onFormReady }: CampusFormProps) {
  const form = useForm<CampusFormValues>({
    resolver: zodResolver(campusSchema),
    defaultValues: {
      school: initial?.school ?? "",
      name: initial?.name ?? "",
      address: initial?.address ?? "",
      phone: initial?.phone ?? "",
      is_active: initial?.is_active ?? true,
    },
    mode: "onChange",
  });

  useEffect(() => {
    onFormReady(form);
  }, [form, onFormReady]);

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="school"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School ID</FormLabel>
              <FormControl>
                <Input placeholder="UUID of school" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campus Name</FormLabel>
                <FormControl>
                  <Input placeholder="Main Campus" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+977..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="City, Street" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <p className="text-xs text-muted-foreground">Disable to hide from selection.</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
