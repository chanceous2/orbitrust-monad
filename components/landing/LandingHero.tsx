import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { OrbiTrustLogo } from "@/components/OrbiTrustLogo";
import { PresentationImage } from "./PresentationImage";
import { PresentationSlide } from "./PresentationSlide";
import { LandingHeroNav } from "./LandingHeroNav";

export function LandingHero() {
  return (
    <PresentationSlide
      slide={1}
      slidePosition="bottom"
      dark
      className="bg-black p-0 justify-start"
    >
      <LandingHeroNav />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <PresentationImage
          src="https://public.orbitienda.com/handshake.png"
          alt=""
          fill
          priority
          fetchPriority="high"
          className="origin-bottom scale-[1.06] object-cover object-bottom sm:scale-[1.08]"
          sizes="100vw"
        />
      </div>

      <div className="relative z-10 grid min-h-svh w-full grid-rows-[1fr_auto]">
        <div className="hero-copy flex flex-col items-center justify-end px-6 pb-14 text-center sm:pb-[4.5rem]">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.28em] text-violet-soft/70 sm:text-xs">
            Confianza portable
          </p>

          <OrbiTrustLogo
            variant="light"
            className="mx-auto mt-5 h-[clamp(2rem,4.2vw,3.125rem)] w-auto sm:mt-6"
            priority
          />

          <h1 className="font-display mt-5 max-w-[16ch] text-[clamp(1.875rem,4.1vw,3.125rem)] leading-[1.08] text-white sm:mt-6 sm:max-w-[18ch]">
            Reputación verificable para{" "}
            <em className="text-violet-soft">cada venta</em> que cerrás.
          </h1>

          <p className="mt-4 max-w-md text-[clamp(0.875rem,1.35vw,1rem)] leading-relaxed text-white/55 sm:max-w-lg">
            Ventas reales → reseña del comprador → perfil público de confianza.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:mt-8 sm:gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-deep px-6 py-2.5 text-sm font-medium text-white shadow-[0_10px_36px_rgb(76_29_149_/_0.32)] transition hover:brightness-110 sm:px-7 sm:py-3 sm:text-[0.9375rem]"
            >
              Crear perfil
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/simulador"
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:border-white/45 hover:bg-white/[0.08] sm:px-7 sm:py-3 sm:text-[0.9375rem]"
            >
              Ver demo
            </Link>
          </div>
        </div>

        <div aria-hidden className="h-[44vh] shrink-0 sm:h-[46vh]" />
      </div>
    </PresentationSlide>
  );
}
