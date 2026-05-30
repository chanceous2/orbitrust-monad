import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Eyebrow } from "@/components/Eyebrow";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export function DashboardStoreHero({
  handle,
  profileHref,
}: {
  handle: string;
  profileHref?: string;
}) {
  return (
    <header className="border-b border-line pb-8 pt-1">
      <Eyebrow>Panel del vendedor</Eyebrow>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.05] text-ink">
            @{handle}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            Acá ves tu reputación verificada: ventas cerradas, reseñas reales y el
            puntaje que construís venta a venta.
          </p>
        </div>
        <VerifiedBadge className="shrink-0" />
      </div>
      {profileHref ? (
        <Link
          href={profileHref}
          className="link mt-6 inline-flex items-center gap-1.5 text-sm font-medium"
        >
          Ver perfil público
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </header>
  );
}
