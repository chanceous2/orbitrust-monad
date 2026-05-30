import { LIFECYCLE_STEPS, statusToStepIndex } from "@/lib/orbitrust";
import { Check } from "@/components/icons";

export function OrderLifecycleStepper({
  status,
  reviewed,
  size = "default",
}: {
  status: number;
  reviewed: boolean;
  size?: "default" | "lg";
}) {
  const current = statusToStepIndex(status, reviewed);
  const cancelled = current === -1;
  const large = size === "lg";

  return (
    <div>
      <ol className="flex">
        {LIFECYCLE_STEPS.map((step, i) => {
          const done = !cancelled && i < current;
          const active = !cancelled && i === current;
          const filled = !cancelled && i <= current;
          return (
            <li
              key={step}
              className="relative flex flex-1 flex-col items-center"
            >
              {i > 0 && (
                <span
                  className={`absolute left-[-50%] top-3 h-px w-full ${
                    filled ? "bg-violet" : "bg-line-2"
                  } ${large ? "top-4" : ""}`}
                />
              )}
              <span
                className={`relative z-10 flex items-center justify-center rounded-full border font-mono ${
                  large ? "h-9 w-9 text-xs" : "h-6 w-6 text-[0.7rem]"
                } ${
                  done
                    ? "border-violet bg-violet text-white"
                    : active
                      ? "border-violet bg-surface text-violet-ink ring-2 ring-violet/20"
                      : "border-line-2 bg-surface text-ink-3"
                }`}
              >
                {done ? (
                  <Check className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`mt-2 text-center font-mono uppercase tracking-[0.1em] ${
                  large ? "text-[0.7rem] sm:text-xs" : "text-[0.6rem]"
                } ${active ? "text-ink" : done ? "text-ink-2" : "text-ink-3"}`}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
      {cancelled && (
        <p className="mt-4 rounded-md border border-line bg-paper-2 px-3 py-2 text-center text-sm text-ink-3">
          Esta orden fue cancelada.
        </p>
      )}
    </div>
  );
}
