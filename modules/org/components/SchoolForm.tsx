"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { schoolSchema, type SchoolFormValues } from "../schemas/schools.schema";
import type { School } from "../types/schools.types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ImagePickerField } from "@/components/form/ImagePickerField";

interface SchoolFormProps {
    initial?: School | null;
    onFormReady: (form: any) => void;
}

export function SchoolForm({ initial, onFormReady }: SchoolFormProps) {
    const form = useForm<SchoolFormValues>({
        resolver: zodResolver(schoolSchema),
        defaultValues: {
            code: initial?.code ?? "",
            name: initial?.name ?? "",
            address: initial?.address ?? "",
            phone: initial?.phone ?? "",
            email: initial?.email ?? "",
            logo_file: initial?.logo_file ?? null,
            timezone: initial?.timezone ?? "",
            currency: initial?.currency ?? "",
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
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>School Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="SCH001" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>School Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="ABC School" {...field} />
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

                <div className="grid gap-4 sm:grid-cols-2">
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
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="school@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="timezone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Timezone</FormLabel>
                                <FormControl>
                                    <Input placeholder="Asia/Kathmandu" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <FormControl>
                                    <Input placeholder="NPR" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="logo_file"
                    render={({ field, fieldState }) => (
                        <FormItem>
                            <FormControl>
                                <ImagePickerField
                                    title="School Logo"
                                    hint="Click to upload your school logo"
                                    initialUri={initial?.logo_file ?? null} // if this is URL; else use initial?.logo_url
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={fieldState.error}
                                    fileType="image"
                                    temporary={false} // school logos are usually permanent
                                    deleteOnRemove={false} // set true if you want backend delete on remove
                                />
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
