import type { ReactNode } from "react";

export function PresentationSlide({
  id,
  slide,
  children,
  className = "",
  dark = false,
  slidePosition = "top",
  layout = "centered",
}: {
  id?: string;
  slide?: number;
  children: ReactNode;
  className?: string;
  dark?: boolean;
  slidePosition?: "top" | "bottom";
  layout?: "centered" | "full";
}) {
  const layoutClass =
    layout === "full"
      ? "min-h-svh w-full"
      : "flex min-h-svh w-full flex-col justify-center";

  return (
    <section
      id={id}
      data-presentation-slide
      className={`presentation-slide relative ${layoutClass} ${className}`}
    >
      {slide != null && (
        <span
          className={`absolute z-30 font-mono text-sm tabular-nums sm:text-base ${
            slidePosition === "bottom"
              ? "bottom-6 right-6 sm:bottom-10 sm:right-10"
              : "right-6 top-6 sm:right-10 sm:top-10"
          } ${dark ? "text-white/30" : "text-ink-3/60"}`}
          aria-hidden
        >
          {String(slide).padStart(2, "0")}
        </span>
      )}
      {children}
    </section>
  );
}
