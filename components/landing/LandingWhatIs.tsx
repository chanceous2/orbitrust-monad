import type { ReactNode } from "react";
import { PresentationImage } from "./PresentationImage";
import { PresentationSlide } from "./PresentationSlide";

const pillarBadges = [
  "Venta verificada",
  "Trust score",
  "Portable",
] as const;

function WhatIsBadge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "monad";
}) {
  const base =
    "inline-flex items-center rounded-full border px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] sm:px-4 sm:py-2 sm:text-xs";

  if (variant === "monad") {
    return (
      <span
        className={`${base} normal-case tracking-[0.02em] border-violet-soft/35 bg-violet/15 text-violet-soft`}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`${base} border-white/20 bg-white/[0.06] text-white/80`}
    >
      {children}
    </span>
  );
}

export function LandingWhatIs() {
  return (
    <PresentationSlide
      id="que-es"
      slide={2}
      dark
      layout="full"
      className="bg-black"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <PresentationImage
          src="https://public.orbitienda.com/cart_new_banner.png"
          alt=""
          fill
          className="object-cover object-left"
          sizes="100vw"
        />
      </div>

      <div className="relative z-10 flex min-h-svh w-full items-center justify-end py-16 pl-6 pr-14 sm:py-20 sm:pl-10 sm:pr-20 lg:pl-14 lg:pr-28 xl:pr-36 2xl:pr-44">
        <div className="flex w-full max-w-2xl flex-col items-end text-right lg:max-w-[40rem] xl:max-w-[44rem]">
          <div className="flex flex-wrap justify-end gap-2 sm:gap-2.5">
            <WhatIsBadge>Qué es</WhatIsBadge>
            {pillarBadges.map((label) => (
              <WhatIsBadge key={label}>{label}</WhatIsBadge>
            ))}
            <WhatIsBadge variant="monad">
              Impulsado por red Monad{" "}
              <span className="text-white/55">(Blockchain)</span>
            </WhatIsBadge>
          </div>

          <h2 className="font-display mt-6 text-[clamp(3rem,8.5vw,6.25rem)] leading-[1.02] text-white sm:mt-8">
            <span className="block">Pensado para</span>
            <span className="block">
              <span className="whitespace-nowrap">e-commerce</span> moderno
            </span>
          </h2>

          <p className="mt-6 max-w-lg text-[clamp(1.0625rem,1.75vw,1.375rem)] leading-relaxed text-white/60 sm:mt-8">
            <span className="font-semibold text-white/90">Reviews</span> prueban
            que alguien opinó.{" "}
            <span className="font-semibold text-violet-soft">OrbiTrust</span>{" "}
            prueba que hubo una venta.
          </p>
        </div>
      </div>
    </PresentationSlide>
  );
}
