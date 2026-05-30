import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { OrbiTrustLogo } from "@/components/OrbiTrustLogo";
import { PresentationSlide } from "./PresentationSlide";

export function LandingFooter() {
  return (
    <PresentationSlide
      slide={6}
      dark
      className="border-t border-white/10 bg-ink"
      id="contacto"
    >
      <footer
        data-presentation-footer
        className="container-app flex w-full flex-col justify-between gap-12 py-16 sm:min-h-[60vh] sm:py-20"
      >
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <OrbiTrustLogo variant="light" className="h-11 w-auto sm:h-12" />
            <h2 className="font-display mt-8 text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] text-white">
              Empezá a construir reputación que viaja con vos.
            </h2>
          </div>

          <Link
            href="/dashboard"
            className="btn-primary btn-lg shrink-0 self-start shadow-lg shadow-violet-deep/40 lg:self-auto"
          >
            Abrí tu perfil
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
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
