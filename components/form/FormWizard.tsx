"use client";

import { ReactNode, useMemo, useState } from "react";

export type WizardStep<T> = {
  id: string;
  title?: string;
  validate?: (values: T) => Promise<boolean> | boolean;
  render: (props: {
    next: () => void;
    back: () => void;
    isFirst: boolean;
    isLast: boolean;
  }) => ReactNode;
};

export function FormWizard<T>({
  steps,
  onDone,
}: {
  steps: WizardStep<T>[];
  onDone?: () => void;
}) {
  const [index, setIndex] = useState(0);

  const step = useMemo(() => steps[index], [steps, index]);
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const next = () => {
    if (isLast) onDone?.();
    else setIndex((i) => i + 1);
  };

  const back = () => {
    if (!isFirst) setIndex((i) => i - 1);
  };

  return (
    <div className="space-y-4">
      {step.title && <div className="text-lg font-semibold">{step.title}</div>}
      {step.render({ next, back, isFirst, isLast })}
    </div>
  );
}
