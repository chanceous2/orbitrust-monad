import Image from "next/image";
import { Eyebrow } from "@/components/Eyebrow";

const PLATFORMS = [
  {
    id: "orbitienda",
    name: "Orbitienda",
    note: "Tus ventas y reseñas entran solas cuando publiqués la integración.",
    logo: "https://public.orbitienda.com/logo.png",
    logoClass: "object-contain p-1",
  },
  {
    id: "shopify",
    name: "Shopify",
    note: "Conectá tu tienda y sumá cada venta a tu reputación.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/1280px-Shopify_logo_2018.svg.png",
    logoClass: "object-contain p-2",
  },
] as const;

export function DashboardConnections() {
  return (
    <section aria-labelledby="dashboard-connections-heading">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <Eyebrow>Tu canal de ventas</Eyebrow>
          <h2
            id="dashboard-connections-heading"
            className="font-display mt-2 text-2xl text-ink sm:text-[1.75rem]"
          >
            Dónde vendés hoy
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-ink-2">
          OrbiTrust suma reputación desde la plataforma donde ya tenés tu tienda.
          No hace falta tocar nada acá cuando esté conectado.
        </p>
      </div>

      <div className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-2">
        {PLATFORMS.map((platform) => (
          <article key={platform.id} className="relative bg-surface p-6 sm:p-7">
            <span className="absolute right-4 top-4 border border-line-2 bg-paper px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-3">
              Próximamente
            </span>

            <div className="relative mb-5 h-12 w-32 sm:h-14 sm:w-36">
              <Image
                src={platform.logo}
                alt={platform.name}
                fill
                className={platform.logoClass}
                sizes="144px"
              />
            </div>

            <h3 className="text-base font-semibold text-ink">{platform.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{platform.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
