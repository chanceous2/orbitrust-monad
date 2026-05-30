import { ArrowRight, Zap } from "@/components/icons";
import { PresentationImage } from "./PresentationImage";
import { PresentationSlide } from "./PresentationSlide";

const PLATFORMS = [
  {
    id: "orbitienda",
    name: "Orbitienda",
    logo: "https://public.orbitienda.com/logo.png",
    logoClass: "object-contain p-1",
  },
  {
    id: "shopify",
    name: "Shopify",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg",
    logoClass: "object-contain p-2",
  },
] as const;

const flow = ["Venta en tu tienda", "Link de reseña", "Perfil actualizado"] as const;

export function LandingIntegrations() {
  return (
    <PresentationSlide id="integraciones" slide={4} className="bg-paper-2">
      <div className="container-app py-16 sm:py-20">
        <p className="eyebrow-lg">Integraciones</p>
        <h2 className="font-display mt-4 max-w-3xl text-[clamp(2.25rem,4.5vw,4rem)] leading-[1.05] text-ink">
          Conectá donde ya vendés.
        </h2>
        <p className="mt-4 max-w-xl text-lg text-ink-2 sm:text-xl">
          Tu backend registra la venta. OrbiTrust emite el link. Sin fricción
          para el comprador.
        </p>

        <div className="mt-12 grid gap-px border border-line bg-line sm:mt-14 sm:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <article
              key={platform.id}
              className="flex flex-col items-start bg-surface px-8 py-10 sm:px-10 sm:py-12"
            >
              <div className="relative mb-6 h-16 w-48 sm:h-20 sm:w-56">
                <PresentationImage
                  src={platform.logo}
                  alt={platform.name}
                  fill
                  className={platform.logoClass}
                  sizes="(min-width: 640px) 224px, 192px"
                />
              </div>
              <h3 className="text-2xl font-semibold text-ink">{platform.name}</h3>
              <span className="tag mt-4 border-line-2 bg-paper text-ink-3">
                API · Próximamente
              </span>
            </article>
          ))}
        </div>

        <ol className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-4 sm:mt-14">
          {flow.map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet text-white sm:h-11 sm:w-11">
                {i === 0 ? (
                  <Zap className="h-5 w-5" />
                ) : (
                  <span className="figure text-sm font-semibold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </span>
              <span className="text-lg font-medium text-ink sm:text-xl">
                {step}
              </span>
              {i < flow.length - 1 && (
                <ArrowRight
                  className="mx-1 hidden h-5 w-5 text-ink-3 sm:block"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </PresentationSlide>
  );
}
