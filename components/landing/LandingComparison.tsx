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
    outerEdge: "left" as const,
  },
  {
    id: "random-store",
    src: "https://public.orbitienda.com/test/second.png",
    alt: "Reseñas en una tienda online genérica",
    label: "Tienda random",
    copy: "¿Alguien compró de verdad?",
    tone: "neutral" as const,
    outerEdge: "right" as const,
  },
] as const;

function ComparisonPanel({
  src,
  alt,
  label,
  copy,
  tone,
  outerEdge,
}: (typeof panels)[number]) {
  return (
    <article className="relative h-full w-full min-w-0 overflow-hidden bg-paper">
      <div className="absolute inset-0">
        <PresentationImage
          src={src}
          alt={alt}
          fill
          className="object-cover object-top"
          sizes="50vw"
        />
      </div>

      <div
        className={`comparison-edge-outer pointer-events-none absolute inset-y-0 z-10 ${
          outerEdge === "left"
            ? "left-0 comparison-edge-outer-left"
            : "right-0 comparison-edge-outer-right"
        }`}
        aria-hidden
      />

      <div
        className={`comparison-edge-inner pointer-events-none absolute inset-y-0 z-10 ${
          outerEdge === "left"
            ? "right-0 comparison-edge-inner-left"
            : "left-0 comparison-edge-inner-right"
        }`}
        aria-hidden
      />

      <div
        className="comparison-caption-fade pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[34%] min-h-[9rem] sm:min-h-[10rem]"
        aria-hidden
      />

      <div className="comparison-caption absolute inset-x-0 bottom-0 z-20 px-6 pb-8 pt-20 sm:px-10 sm:pb-10 sm:pt-24 lg:px-12 lg:pb-12">
        <span
          className={`comparison-tag ${
            tone === "verified"
              ? "border-verified-line bg-verified text-white"
              : "border-white/25 bg-ink/90 text-white"
          }`}
        >
          {tone === "verified" ? "Confiable" : "Incertidumbre"}
        </span>
        <h3 className="font-display mt-5 text-[clamp(2rem,3.8vw,3.25rem)] font-medium leading-[1.06] text-white">
          {label}
        </h3>
        <p className="mt-3 max-w-lg text-[clamp(1.05rem,1.8vw,1.5rem)] font-medium leading-snug text-white/92">
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
      layout="full"
      dark
      className="overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 grid w-full grid-cols-2">
        {panels.map((panel) => (
          <ComparisonPanel key={panel.id} {...panel} />
        ))}
      </div>

      <header className="absolute inset-x-0 top-0 z-20 border-b border-black/10 bg-paper/95 px-6 py-6 backdrop-blur-sm sm:px-10 sm:py-7">
        <p className="font-mono text-sm uppercase tracking-[0.22em] text-ink-3 sm:text-base">
          Comparación
        </p>
        <h2 className="font-display mt-2 text-[clamp(1.85rem,3.6vw,3rem)] font-medium leading-[1.06] text-ink">
          No todas las reseñas pesan igual.
        </h2>
      </header>
    </PresentationSlide>
  );
}
