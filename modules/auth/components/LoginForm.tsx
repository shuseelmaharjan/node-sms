"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { loginSchema, type LoginSchema } from "../schema/schema";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: LoginSchema) {
    try {
      await login(values.identifier, values.password);
      router.replace(redirectTo);
      router.refresh();
    } catch (err: any) {
      // Error toasts are now handled automatically by the API interceptor
      // Just set form error for display if needed
      const message = err?.message || "Invalid credentials. Please try again.";
      console.error("Login error:", message);
    }
  }

  return (
    <div className="min-h-[calc(100vh-1px)] w-full flex items-center justify-center px-4 py-10">
      {/* background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 [background:radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.12),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.12),transparent_50%)]" />

      <Card className="w-full max-w-md shadow-lg border-slate-200/70 dark:border-slate-800/70">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in using your email or phone number.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin@school.com or 98XXXXXXXX"
                        autoComplete="username"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          form.clearErrors("root");
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <button
                        type="button"
                        className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          form.clearErrors("root");
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Root error */}
              {form.formState.errors.root?.message && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                  {form.formState.errors.root.message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <Separator />

              <p className="text-center text-xs text-slate-500">
                By continuing, you agree to our terms and privacy policy.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
