import {
  BadgeCheck,
  Link2,
  Receipt,
  ShieldCheck,
  Star,
  User,
  X,
} from "@/components/icons";
import { Fragment } from "react";
import { PresentationSlide } from "./PresentationSlide";

const flowSteps = [
  { icon: Receipt, label: "Venta pagada", actor: "Tienda", step: "01" },
  { icon: Link2, label: "Link único", actor: "Comprador", step: "03" },
  { icon: Star, label: "1 reseña", actor: "Validación", step: "04" },
  {
    icon: BadgeCheck,
    label: "Perfil público",
    actor: "Reputación",
    step: "05",
    final: true,
  },
] as const;

const hubStep = {
  icon: ShieldCheck,
  label: "Orden verificada",
  actor: "OrbiTrust",
  step: "02",
} as const;

const guaranteed = [
  { icon: Receipt, label: "Venta real" },
  { icon: User, label: "Comprador real" },
  { icon: BadgeCheck, label: "Opinión verificada" },
] as const;

const blocked = [
  { icon: Star, label: "Sin compra" },
  { icon: ShieldCheck, label: "Duplicada" },
  { icon: Link2, label: "Link ajeno" },
] as const;

function FlowArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 16"
      className={`h-4 w-10 shrink-0 text-violet-soft/70 ${className}`}
      fill="none"
      aria-hidden
    >
      <path d="M1 8 H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M22 3 L31 8 L22 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlowNode({
  icon: Icon,
  label,
  actor,
  step,
  final,
  wide,
}: {
  icon: (typeof flowSteps)[number]["icon"] | typeof hubStep.icon;
  label: string;
  actor: string;
  step: string;
  final?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`relative z-10 flex w-full flex-col items-center rounded-xl border text-center ${
        wide ? "max-w-none px-6 py-5 sm:px-10" : "px-3 py-4 sm:px-4 sm:py-5"
      } ${
        final
          ? "border-verified-line/45 bg-verified/10 shadow-[0_0_32px_rgb(52_211_153_/_0.08)]"
          : wide
            ? "border-violet-line/40 bg-violet/15 shadow-[0_0_40px_rgb(139_92_246_/_0.12)]"
            : "border-violet-line/35 bg-[#1a1512]/95"
      }`}
    >
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-white/35">
        {step}
      </span>
      <span
        className={`mt-2 flex h-11 w-11 items-center justify-center rounded-full border sm:h-12 sm:w-12 ${
          final
            ? "border-verified-line/40 bg-verified/15 text-verified"
            : wide
              ? "border-violet-soft/40 bg-violet/25 text-violet-soft"
              : "border-violet-soft/35 bg-violet/20 text-violet-soft"
        }`}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>
      <p className="mt-3 text-sm font-semibold leading-tight text-white sm:text-base">
        {label}
      </p>
      <span
        className={`mt-2 rounded-full border px-2.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] ${
          final
            ? "border-verified-line/30 text-verified"
            : wide
              ? "border-violet-line/30 text-violet-soft"
              : "border-white/10 text-white/40"
        }`}
      >
        {actor}
      </span>
    </div>
  );
}

function HubConnectors() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-[8%] top-0 h-full w-[84%] text-violet-soft/35"
      viewBox="0 0 800 80"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      <path d="M60 4 V36 H740 V4" stroke="currentColor" strokeWidth="1.75" strokeDasharray="5 4" />
      <path d="M60 36 V68" stroke="currentColor" strokeWidth="1.75" />
      <path d="M400 36 V68" stroke="rgb(52 211 153 / 0.55)" strokeWidth="2" />
      <path d="M740 36 V68" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function TrustChainDiagram() {
  return (
    <div className="security-flow-diagram mx-auto w-full max-w-5xl">
      <div className="hidden sm:block">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-1 lg:gap-x-2">
          {flowSteps.map((step, index) => (
            <Fragment key={step.label}>
              {index > 0 ? <FlowArrow /> : null}
              <FlowNode {...step} />
            </Fragment>
          ))}
        </div>

        <div className="relative mt-3 h-16 lg:mt-4 lg:h-[4.5rem]">
          <HubConnectors />
        </div>

        <div className="mx-auto max-w-md lg:max-w-lg">
          <FlowNode {...hubStep} wide />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        <FlowNode {...flowSteps[0]} />
        <div className="mx-auto font-mono text-sm text-violet-soft/50" aria-hidden>
          ↓
        </div>
        <FlowNode {...hubStep} wide />
        {flowSteps.slice(1).map((step) => (
          <Fragment key={step.label}>
            <div className="mx-auto font-mono text-sm text-violet-soft/50" aria-hidden>
              ↓
            </div>
            <FlowNode {...step} final={"final" in step && step.final} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function VisualTile({
  icon: Icon,
  label,
  tone,
}: {
  icon: (typeof guaranteed)[number]["icon"];
  label: string;
  tone: "ok" | "block";
}) {
  const ok = tone === "ok";

  return (
    <li
      className={`flex flex-col items-center gap-3 rounded-lg border px-3 py-4 text-center sm:py-5 ${
        ok
          ? "border-verified-line/30 bg-verified/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <span
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border ${
          ok
            ? "border-verified-line/40 bg-verified/15 text-verified"
            : "border-white/15 bg-ink text-white/40"
        }`}
      >
        <Icon className="h-5 w-5" />
        {!ok ? (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-ink text-white/70">
            <X className="h-3 w-3" />
          </span>
        ) : null}
      </span>
      <span
        className={`text-sm font-semibold leading-tight ${
          ok ? "text-white" : "text-white/65"
        }`}
      >
        {label}
      </span>
    </li>
  );
}

export function LandingReviewSecurity() {
  return (
    <PresentationSlide id="seguridad" slide={5} dark className="bg-ink">
      <div className="container-app flex min-h-svh flex-col justify-center py-14 sm:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-sm uppercase tracking-[0.22em] text-violet-soft/80">
            Por qué confiar
          </p>
          <h2 className="font-display mt-3 text-[clamp(2rem,4.2vw,3.5rem)] leading-[1.06] text-white">
            Cada reseña va atada a una venta real
          </h2>
        </header>

        <div className="security-diagram-shell relative mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#12100e] px-4 py-8 sm:mt-12 sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:24px_24px]"
            aria-hidden
          />

          <div className="relative mb-6 flex flex-wrap items-center justify-center gap-2 sm:mb-8 sm:gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/45">
              Entrada
            </span>
            <FlowArrow className="w-6" />
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/50">
              Cadena de confianza
            </span>
            <FlowArrow className="w-6" />
            <span className="rounded-full border border-verified-line/30 bg-verified/10 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-verified">
              Salida verificada
            </span>
          </div>

          <TrustChainDiagram />

          <p className="relative mt-8 text-center font-mono text-xs uppercase tracking-[0.12em] text-verified sm:mt-10 sm:text-sm">
            <ShieldCheck className="mr-1.5 inline-block h-4 w-4 align-[-2px]" />
            Venta comercial probada
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <section aria-labelledby="security-guaranteed">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-verified" aria-hidden />
              <h3
                id="security-guaranteed"
                className="font-mono text-xs uppercase tracking-[0.18em] text-verified"
              >
                Garantizado
              </h3>
            </div>
            <ul className="grid grid-cols-3 gap-3">
              {guaranteed.map((item) => (
                <VisualTile key={item.label} {...item} tone="ok" />
              ))}
            </ul>
          </section>

          <section aria-labelledby="security-blocked">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white/25" aria-hidden />
              <h3
                id="security-blocked"
                className="font-mono text-xs uppercase tracking-[0.18em] text-white/40"
              >
                Bloqueado
              </h3>
            </div>
            <ul className="grid grid-cols-3 gap-3">
              {blocked.map((item) => (
                <VisualTile key={item.label} {...item} tone="block" />
              ))}
            </ul>
          </section>
        </div>
      </div>
    </PresentationSlide>
  );
}
