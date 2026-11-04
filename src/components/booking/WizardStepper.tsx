"use client";

import { CheckIcon } from "@/components/icons";

type Step = {
  key: string;
  label: string;
};

const STEPS: Step[] = [
  { key: "addons", label: "Additional Service" },
  { key: "details", label: "Booking Form" },
  { key: "payment", label: "Payment" },
  { key: "result", label: "Result" },
];

export default function WizardStepper({ currentStep }: { currentStep: string }) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="mb-6 overflow-x-auto lg:mb-8">
      <div className="flex min-w-max items-center gap-2 px-1 py-2 lg:gap-4">
        {STEPS.map((step, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <div key={step.key} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isCurrent
                    ? "bg-brand text-white"
                    : isDone
                      ? "bg-brand-soft text-brand"
                      : "bg-canvas text-muted"
                }`}
              >
                {isDone ? <CheckIcon width={16} height={16} /> : i + 1}
              </div>
              <span
                className={`whitespace-nowrap text-sm font-semibold ${
                  isCurrent ? "text-ink" : isDone ? "text-brand" : "text-muted"
                }`}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="mx-2 h-px w-8 bg-line lg:w-12" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
