"use client";

import { Check } from "@/components/icons";

export type OnboardingStepId = "stores" | "integrations";

const STEPS: { id: OnboardingStepId; label: string }[] = [
  { id: "stores", label: "Tu tienda" },
  { id: "integrations", label: "Integración" },
];

export function OnboardingShell({
  step,
  children,
}: {
  step: OnboardingStepId;
  children: React.ReactNode;
}) {
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="flex flex-1 flex-col justify-center bg-paper px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-2xl lg:max-w-3xl">
        <nav aria-label="Pasos del onboarding" className="mb-8 sm:mb-10">
          <ol className="flex items-center gap-3 sm:gap-4">
            {STEPS.map((item, index) => {
              const done = index < stepIndex;
              const current = item.id === step;

              return (
                <li key={item.id} className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`figure flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold sm:h-11 sm:w-11 ${
                      done
                        ? "bg-verified text-white"
                        : current
                          ? "bg-violet text-white"
                          : "border border-line-2 bg-surface text-ink-3"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span
                    className={`truncate text-sm font-medium sm:text-base ${
                      current ? "text-ink" : done ? "text-ink-2" : "text-ink-3"
                    }`}
                  >
                    {item.label}
                  </span>
                  {index < STEPS.length - 1 ? (
                    <span
                      className={`ml-auto hidden h-px flex-1 sm:block ${
                        done ? "bg-verified/60" : "bg-line"
                      }`}
                      aria-hidden
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="border border-line bg-surface p-6 sm:p-10 lg:p-12">{children}</div>
      </div>
    </div>
  );
}
