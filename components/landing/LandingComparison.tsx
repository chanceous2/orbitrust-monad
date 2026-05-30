import { PresentationImage } from "./PresentationImage";
import { PresentationSlide } from "./PresentationSlide";

const panels = [
  {
    id: "marketplace",
    src: "https://public.orbitienda.com/test/first.png",
    alt: "Reseñas verificadas en Mercado Libre",
    label: "Mercado Libre",
    copy: "Sabés de dónde viene cada opinión.",
    tone: "verified" as const,
  },
  {
    id: "random-store",
    src: "https://public.orbitienda.com/test/second.png",
    alt: "Reseñas en una tienda online genérica",
    label: "Tienda random",
    copy: "¿Alguien compró de verdad?",
    tone: "neutral" as const,
  },
] as const;

function ComparisonPanel({
  src,
  alt,
  label,
  copy,
  tone,
}: (typeof panels)[number]) {
  const verified = tone === "verified";

  return (
    <article className="flex min-h-[min(52svh,30rem)] min-w-0 flex-1 flex-col bg-black sm:min-h-0">
      <div className="relative min-h-[20rem] w-full flex-1 overflow-hidden bg-black sm:min-h-0">
        <PresentationImage
          src={src}
          alt={alt}
          fill
          className="object-cover object-top"
          sizes="(min-width: 1024px) 46vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>

      <div className="flex shrink-0 flex-col border-t border-white/10 p-5 sm:p-6">
        <span
          className={`tag w-fit ${
            verified
              ? "border-verified-line/40 bg-verified/15 text-verified"
              : "border-white/15 bg-white/[0.04] text-white/55"
          }`}
        >
          {verified ? "Confiable" : "Incertidumbre"}
        </span>
        <h3 className="font-display mt-3 text-[clamp(1.5rem,2.4vw,2.125rem)] font-medium leading-[1.06] text-white">
          {label}
        </h3>
        <p className="mt-2 max-w-md text-base leading-snug text-white/65 sm:text-lg">
          {copy}
        </p>
      </div>
    </article>
  );
}

export function LandingComparison() {
  return (
    <PresentationSlide
      id="comparacion"
      slide={3}
      slidePosition="bottom"
      dark
      className="bg-black"
    >
      <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-5 py-12 sm:px-8 sm:py-14">
        <header className="mb-6 shrink-0 sm:mb-7">
          <p className="font-mono text-sm uppercase tracking-[0.22em] text-white/45 sm:text-base">
            Comparación
          </p>
          <h2 className="font-display mt-3 max-w-3xl text-[clamp(2rem,4vw,3.25rem)] leading-[1.06] text-white">
            No todas las reseñas pesan igual.
          </h2>
        </header>

        <div className="card-dark flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {panels.map((panel) => (
              <ComparisonPanel key={panel.id} {...panel} />
            ))}
          </div>
        </div>
      </div>
    </PresentationSlide>
  );
}
