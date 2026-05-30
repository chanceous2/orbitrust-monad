import { ShieldCheck, Star, Link2 } from "@/components/icons";
import { PresentationSlide } from "./PresentationSlide";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Venta verificada",
    copy: "Cada reseña está ligada a una operación real.",
  },
  {
    icon: Star,
    title: "Trust score",
    copy: "Rating + ventas completadas en un perfil público.",
  },
  {
    icon: Link2,
    title: "Portable",
    copy: "Mostrá tu reputación en cualquier canal donde vendés.",
  },
] as const;

export function LandingWhatIs() {
  return (
    <PresentationSlide id="que-es" slide={2} className="bg-paper">
      <div className="container-app py-16 sm:py-20">
        <p className="eyebrow-lg">Qué es</p>
        <h2 className="font-display mt-4 max-w-3xl text-[clamp(2.25rem,4.5vw,4rem)] leading-[1.05] text-ink">
          Un registro de confianza, no solo opiniones.
        </h2>

        <ul className="mt-14 grid gap-8 sm:mt-16 lg:grid-cols-3 lg:gap-10">
          {pillars.map((item, i) => (
            <li
              key={item.title}
              className="flex flex-col border-t border-line pt-6 sm:pt-8"
            >
              <span className="figure mb-5 text-3xl text-violet-ink/50 sm:text-4xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-violet-line bg-violet-soft text-violet-ink">
                <item.icon className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-semibold text-ink sm:text-2xl">
                {item.title}
              </h3>
              <p className="mt-2 max-w-xs text-lg leading-snug text-ink-2 sm:text-xl">
                {item.copy}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-14 max-w-2xl border-t border-line pt-8 text-lg text-ink-2 sm:mt-16 sm:text-xl">
          <span className="font-semibold text-ink">Reviews</span> prueban que
          alguien opinó.{" "}
          <span className="font-semibold text-violet-ink">OrbiTrust</span> prueba
          que hubo una venta.
        </p>
      </div>
    </PresentationSlide>
  );
}
