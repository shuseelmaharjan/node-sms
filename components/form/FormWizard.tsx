"use client";

import React, { useEffect, useMemo } from "react";
import { z } from "zod";
import {
  DefaultValues,
  FieldValues,
  FormProvider,
  UseFormReturn,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Schema = z.ZodObject<any, any>;
type Values<S extends Schema> = z.infer<S> & FieldValues;
type WizardMethods<S extends Schema> = UseFormReturn<Values<S>, any, Values<S>>;

export type FormWizardProps<S extends Schema> = {
  schema: S;
  defaultValues: DefaultValues<Values<S>>;
  render: (methods: WizardMethods<S>) => React.ReactNode;
  onSubmit: (
    values: Values<S>,
    methods: WizardMethods<S>
  ) => void | Promise<void>;
  submitLabel?: string;
  submitLoading?: boolean;
  blocked?: boolean;
  onCancel?: () => void;
  disableSubmitUntilDirty?: boolean;
  resetKey?: string | number;
  className?: string;
  externallyBlocked?: boolean;
};

export function FormWizard<S extends Schema>({
  schema,
  defaultValues,
  render,
  onSubmit,
  submitLabel = "Save",
  submitLoading = false,
  blocked = false,
  onCancel,
  disableSubmitUntilDirty = true,
  resetKey,
  className,
  externallyBlocked = false,
}: FormWizardProps<S>) {
  const stableDefaults = useMemo(() => defaultValues, [defaultValues]);

  const methods = useForm<Values<S>, any, Values<S>>({
    resolver: zodResolver(schema) as any,
    defaultValues: stableDefaults,
    mode: "onChange",
  });

  useEffect(() => {
    if (resetKey == null) return;

    methods.reset(stableDefaults, {
      keepDefaultValues: false,
    });
    methods.clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const handleReset = () => {
    methods.reset(stableDefaults, { keepDefaultValues: false });
    methods.clearErrors();
  };

  const isDirty = methods.formState.isDirty;
  const isValid = methods.formState.isValid;
  const isBlocked = blocked || externallyBlocked || submitLoading;

  const canSubmit =
    !isBlocked && isValid && (!disableSubmitUntilDirty || isDirty);

  const submit = methods.handleSubmit((values) => onSubmit(values, methods));

  return (
    <FormProvider {...methods}>
      <form onSubmit={submit} className={cn("space-y-6", className)}>
        <div className="space-y-6">{render(methods)}</div>

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div className="text-xs">
            {isDirty ? (
              <span className="text-warn font-medium">Unsaved changes</span>
            ) : null}
          </div>

          <div className="flex gap-2">
            {onCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isBlocked}
              >
                Cancel
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isBlocked || !isDirty}
            >
              Reset
            </Button>

            <Button type="submit" disabled={!canSubmit}>
              {submitLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  <span className="text-sm">Submitting...</span>
                </span>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
