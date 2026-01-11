"use client";

import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  DefaultValues,
  FieldPath,
  FieldValues,
  FormProvider,
  UseFormReturn,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Zod v4 classic doesn't export AnyZodObject.
 * Use a "generic object schema" constraint instead.
 */
type Schema = z.ZodObject<any, any>;

/** RHF wants object FieldValues; intersect to satisfy constraints */
type Values<S extends Schema> = z.infer<S> & FieldValues;

/**
 * Keep transformed-values type the same as Values<S>
 * to avoid handleSubmit type mismatch.
 */
type WizardMethods<S extends Schema> = UseFormReturn<Values<S>, any, Values<S>>;

export type StepDef<S extends Schema> = {
  key: string;
  title: string;
  description?: string;

  /** Fields to validate when clicking Next. If omitted -> validate whole form */
  fields?: FieldPath<Values<S>>[];

  /** Optional extra gate (ex: async checks). Return false to block Next. */
  validate?: (methods: WizardMethods<S>) => boolean | Promise<boolean>;

  render: (methods: WizardMethods<S>) => React.ReactNode;
};

export type DirtyBarPlacement = "header" | "footer" | "none";

export type FormWizardProps<S extends Schema> = {
  title?: string;
  schema: S;
  defaultValues: DefaultValues<Values<S>>;

  steps?: StepDef<S>[]; // if not provided => normal (non-stepper) form
  renderSections?: (methods: WizardMethods<S>) => React.ReactNode;

  submitLabel?: string;
  onSubmit: (values: Values<S>, methods: WizardMethods<S>) => void | Promise<void>;

  /** disables submit + navigation */
  submitDisabled?: boolean;
  submitLoading?: boolean;

  /** editing UX */
  isEditing?: boolean;
  onCancelEditing?: () => void;

  /** RHF behavior */
  unregisterOnExit?: boolean;

  /** layout */
  stickyFooter?: boolean;
  className?: string;

  dirtyBarPlacement?: DirtyBarPlacement;
  canEdit?: boolean;

  /** change this to force reset (like switching records) */
  resetKey?: string | number;

  /**
   * External blockers (ex: image uploading). If true -> disable Next/Submit.
   */
  externallyBlocked?: boolean;
};

export function FormWizard<S extends Schema>({
  title,
  schema,
  defaultValues,
  steps,
  renderSections,
  submitLabel = "Submit",
  onSubmit,
  unregisterOnExit = false,
  submitDisabled = false,
  submitLoading = false,
  isEditing = false,
  onCancelEditing,
  stickyFooter = true,
  className,
  dirtyBarPlacement = "none",
  canEdit = true,
  resetKey,
  externallyBlocked = false,
}: FormWizardProps<S>) {
  const stableDefaults = useMemo(() => defaultValues, [defaultValues]);

  const methods = useForm<Values<S>, any, Values<S>>({
    resolver: zodResolver(schema) as any,
    defaultValues: stableDefaults,
    mode: "onChange",
    shouldUnregister: unregisterOnExit,
  });

  useEffect(() => {
    if (resetKey == null) return;
    methods.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const isStepper = !!steps?.length;
  const isDirty = methods.formState.isDirty;

  const blocked = submitDisabled || submitLoading || externallyBlocked || !canEdit;

  const resetForm = () => methods.reset(stableDefaults);

  const submit = methods.handleSubmit((values) => onSubmit(values, methods));

  const DirtyBar = (
    <div className="flex items-center gap-2">
      {isDirty && (
        <span className="text-xs text-warn font-medium">Unsaved changes</span>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={!isDirty || blocked}
        onClick={resetForm}
      >
        Reset
      </Button>
      <Button type="submit" disabled={blocked}>
        {submitLoading ? "Saving..." : submitLabel}
      </Button>
    </div>
  );

  // SIMPLE (NON-STEPPER) FORM
  if (!isStepper) {
    return (
      <FormProvider {...methods}>
        <form
          onSubmit={submit}
          className={cn("flex flex-col gap-6 p-6 bg-white rounded-xl border", className)}
        >
          {(title || dirtyBarPlacement === "header") && (
            <div className="flex justify-between items-start gap-4">
              {title && <h2 className="font-semibold text-primary">{title}</h2>}
              {dirtyBarPlacement === "header" && DirtyBar}
            </div>
          )}

          {renderSections?.(methods)}

          {dirtyBarPlacement === "footer" && (
            <div className="flex justify-end gap-2">{DirtyBar}</div>
          )}

          {dirtyBarPlacement === "none" && (
            <div className="flex justify-end gap-2">
              {isEditing && onCancelEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancelEditing}
                  disabled={blocked}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={blocked}>
                {submitLoading ? "Saving..." : submitLabel}
              </Button>
            </div>
          )}
        </form>
      </FormProvider>
    );
  }

  // STEPPER FORM
  return (
    <FormProvider {...methods}>
      <WizardStepperBody
        title={title}
        steps={steps!}
        methods={methods}
        submitLabel={submitLabel}
        onSubmit={submit}
        blocked={blocked}
        submitLoading={submitLoading}
        isEditing={isEditing}
        onCancelEditing={onCancelEditing}
        stickyFooter={stickyFooter}
        dirtyBarPlacement={dirtyBarPlacement}
        onReset={resetForm}
        className={className}
        resetKey={resetKey}
      />
    </FormProvider>
  );
}

function WizardStepperBody<S extends Schema>(props: {
  title?: string;
  steps: StepDef<S>[];
  methods: WizardMethods<S>;
  submitLabel: string;
  onSubmit: () => void;
  blocked: boolean;
  submitLoading: boolean;
  isEditing?: boolean;
  onCancelEditing?: () => void;
  stickyFooter: boolean;
  dirtyBarPlacement: DirtyBarPlacement;
  onReset: () => void;
  className?: string;
  resetKey?: string | number;
}) {
  const {
    title,
    steps,
    methods,
    submitLabel,
    onSubmit,
    blocked,
    submitLoading,
    isEditing,
    onCancelEditing,
    stickyFooter,
    dirtyBarPlacement,
    onReset,
    className,
    resetKey,
  } = props;

  const [idx, setIdx] = useState(0);

  // Reset step index when switching records, etc.
  useEffect(() => {
    if (resetKey == null) return;
    setIdx(0);
  }, [resetKey]);

  // Keep idx valid if steps length changes
  useEffect(() => {
    setIdx((i) => Math.min(i, Math.max(steps.length - 1, 0)));
  }, [steps.length]);

  const last = idx === steps.length - 1;
  const current = steps[idx];
  const isDirty = methods.formState.isDirty;

  const goNext = async () => {
    if (blocked) return;

    const ok = current.fields?.length
      ? await methods.trigger(current.fields, { shouldFocus: true })
      : await methods.trigger(undefined, { shouldFocus: true });

    if (!ok) return;

    if (current.validate) {
      const pass = await current.validate(methods);
      if (!pass) return;
    }

    setIdx((p) => Math.min(p + 1, steps.length - 1));
  };

  const goBack = () => setIdx((p) => Math.max(p - 1, 0));

  const DirtyBar = (
    <div className="flex items-center gap-2">
      {isDirty && (
        <span className="text-xs text-warn font-medium">Unsaved changes</span>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={!isDirty || blocked}
        onClick={onReset}
      >
        Reset
      </Button>
      {last && (
        <Button type="button" disabled={blocked} onClick={onSubmit}>
          {submitLoading ? "Saving..." : submitLabel}
        </Button>
      )}
    </div>
  );

  return (
    <form
      className={cn("flex flex-col bg-white p-6 rounded-xl border gap-6", className)}
      onSubmit={(e) => e.preventDefault()}
    >
      {(title || dirtyBarPlacement === "header") && (
        <div className="flex justify-between items-start gap-4">
          {title && <h2 className="text-xl font-semibold text-primary">{title}</h2>}
          {dirtyBarPlacement === "header" && DirtyBar}
        </div>
      )}

      <div>
        <p className="text-sm font-medium">{current.title}</p>
        {current.description && (
          <p className="text-xs text-muted-foreground">{current.description}</p>
        )}
      </div>

      <div>{current.render(methods)}</div>

      <div
        className={cn(
          "flex justify-between items-center gap-4",
          stickyFooter && "sticky bottom-0 bg-white pt-4 border-t"
        )}
      >
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={idx === 0 || blocked} onClick={goBack}>
            Back
          </Button>

          {isEditing && onCancelEditing && (
            <Button type="button" variant="outline" onClick={onCancelEditing} disabled={blocked}>
              Cancel
            </Button>
          )}
        </div>

        {!last ? (
          <Button type="button" onClick={goNext} disabled={blocked}>
            Next
          </Button>
        ) : (
          dirtyBarPlacement === "footer" && DirtyBar
        )}
      </div>
    </form>
  );
}
