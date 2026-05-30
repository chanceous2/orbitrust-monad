import Link from "next/link";
import { Eyebrow } from "@/components/Eyebrow";
import { ArrowRight } from "@/components/icons";
import { OrbiTrustLogo } from "@/components/OrbiTrustLogo";

export function DashboardGuestGate() {
  return (
    <div className="page-centered">
      <div className="container-narrow w-full max-w-4xl text-center">
        <OrbiTrustLogo variant="dark" className="mx-auto h-14 w-auto sm:h-16" />

        <Eyebrow className="eyebrow-lg mt-10">Panel del vendedor</Eyebrow>
        <h1 className="font-display mt-5 text-4xl leading-[1.06] text-ink sm:text-6xl lg:text-7xl">
          Registrá tu tienda o iniciá sesión
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2 sm:text-2xl">
          Creá tu perfil con email y contraseña. OrbiTrust genera tu identidad
          de tienda y cubre el registro de ventas — sin apps extra ni pagos raros.
        </p>

        <div className="mx-auto mt-12 flex max-w-2xl flex-col items-stretch gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login?mode=signup"
            className="btn-primary btn-lg sm:min-w-[18rem]"
          >
            Registrarme
            <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
          </Link>
          <Link
            href="/login"
            className="btn-secondary btn-lg sm:min-w-[18rem]"
          >
            Iniciar sesión
          </Link>
        </div>

        <p className="mt-10 text-base text-ink-3 sm:text-lg">
          ¿Solo querés ver cómo funciona?{" "}
          <Link href="/simulador" className="link text-lg sm:text-xl">
            Probar el simulador de órdenes
          </Link>
        </p>
      </div>
    </div>
  );
}

export function DashboardGuestLoading() {
  return (
    <div className="page-centered">
      <div className="container-narrow max-w-4xl space-y-6 text-center">
        <div className="mx-auto h-24 w-24 animate-pulse rounded-2xl bg-paper-2" />
        <div className="mx-auto h-5 w-40 animate-pulse rounded bg-paper-2" />
        <div className="mx-auto h-16 w-full max-w-xl animate-pulse rounded-lg bg-paper-2" />
        <div className="mx-auto h-8 w-full max-w-2xl animate-pulse rounded bg-paper-2" />
        <div className="mx-auto flex max-w-xl flex-col gap-4 sm:flex-row sm:justify-center">
          <div className="h-16 flex-1 animate-pulse rounded-lg bg-paper-2" />
          <div className="h-16 flex-1 animate-pulse rounded-lg bg-paper-2" />
        </div>
      </div>
    </div>
  );
}
