import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { OrbiTrustLogo } from "@/components/OrbiTrustLogo";
import { PresentationImage } from "./PresentationImage";
import { PresentationSlide } from "./PresentationSlide";

export function LandingFooter() {
  return (
    <PresentationSlide
      slide={6}
      dark
      layout="full"
      className="bg-black"
      id="contacto"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <PresentationImage
          src="https://public.orbitienda.com/sobrenube.png"
          alt=""
          fill
          className="object-cover object-[center_35%] sm:object-right"
          sizes="100vw"
        />
      </div>

      <footer
        data-presentation-footer
        className="relative z-10 flex min-h-svh w-full flex-col justify-between px-6 py-16 sm:px-10 sm:py-20 lg:px-14"
      >
        <div className="hero-copy max-w-2xl">
          <OrbiTrustLogo variant="light" className="h-11 w-auto sm:h-12" />
          <h2 className="font-display mt-8 text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] text-white">
            Empezá a construir reputación que viaja con vos.
          </h2>
          <Link
            href="/dashboard"
            className="btn-primary btn-lg mt-8 inline-flex w-fit shadow-lg shadow-violet-deep/40"
          >
            Abrí tu perfil
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="hero-copy flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base text-white/60">
            <Link href="/dashboard" className="transition hover:text-white">
              Panel
            </Link>
            <Link href="/simulador" className="transition hover:text-white">
              Simulador
            </Link>
            <a
              href="https://testnet.monadexplorer.com"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white"
            >
              Registro público
            </a>
          </nav>
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-white/35">
            Demo · sin pagos reales
          </p>
        </div>
      </footer>
    </PresentationSlide>
  );
}
