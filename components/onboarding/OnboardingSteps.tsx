"use client";

import Image from "next/image";
import { ArrowRight } from "@/components/icons";
import type { SellerStore } from "@/lib/sellers/useSellerSession";
import { OnboardingForm } from "@/components/OnboardingForm";
import { LoadingButton } from "@/components/LoadingButton";
import { Eyebrow } from "@/components/Eyebrow";

export function OnboardingStoresStep({
  stores,
  onStoreCreated,
  onContinue,
}: {
  stores: SellerStore[];
  onStoreCreated: () => void;
  onContinue: () => void;
}) {
  const registered = stores.filter((s) => s.registeredOnChain);

  return (
    <div>
      <header className="max-w-xl">
        <Eyebrow className="eyebrow-lg">Tu identidad de vendedor</Eyebrow>
        <h2 className="font-display mt-3 text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] text-ink">
          Creá tu tienda
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-2 sm:text-xl">
          Elegí el identificador público de tu tienda. Podés sumar más después.
        </p>
      </header>

      <div className="mt-10 sm:mt-12">
        <OnboardingForm
          onSuccess={onStoreCreated}
          onContinue={onContinue}
          size="presentation"
          embedded
          unifiedAction
          registeredStores={registered}
        />
      </div>
    </div>
  );
}

const INTEGRATIONS = [
  {
    id: "orbitienda",
    name: "Orbitienda",
    description: "Ventas y reseñas desde tu tienda Orbitienda.",
    logo: "https://public.orbitienda.com/logo.png",
    logoClass: "object-contain p-1",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Pedidos y reputación con tu Shopify.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/1280px-Shopify_logo_2018.svg.png",
    logoClass: "object-contain p-2",
  },
] as const;

export function OnboardingIntegrationsStep({
  onFinish,
  onBack,
  finishing,
}: {
  onFinish: () => void;
  onBack: () => void;
  finishing: boolean;
}) {
  return (
    <div>
      <header className="max-w-xl">
        <Eyebrow className="eyebrow-lg">Conexión con tu ecommerce</Eyebrow>
        <h2 className="font-display mt-3 text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] text-ink">
          Integración
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-2 sm:text-xl">
          Las ventas verificadas entran desde la plataforma donde ya vendés.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2">
        {INTEGRATIONS.map((item) => (
          <article
            key={item.id}
            className="relative border border-line bg-paper-2/30 p-6 sm:p-7"
          >
            <span className="absolute right-4 top-4 border border-line-2 bg-surface px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-3">
              Próximamente
            </span>

            <div className="relative mb-6 mt-1 h-14 w-36 sm:h-16 sm:w-44">
              <Image
                src={item.logo}
                alt={item.name}
                fill
                className={item.logoClass}
                sizes="180px"
              />
            </div>

            <h3 className="text-lg font-semibold text-ink">{item.name}</h3>
            <p className="mt-2 text-base leading-relaxed text-ink-2">{item.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-line pt-8 sm:mt-14 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary btn-lg order-2 sm:order-1 sm:min-w-[10rem]"
        >
          Volver
        </button>
        <LoadingButton
          type="button"
          loading={finishing}
          onClick={onFinish}
          className="btn-lg order-1 flex-1 sm:order-2"
        >
          Ir al panel
          <ArrowRight className="h-5 w-5" aria-hidden />
        </LoadingButton>
      </div>
    </div>
  );
}
