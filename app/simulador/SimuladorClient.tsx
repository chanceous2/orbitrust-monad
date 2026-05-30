"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LoadingButton } from "@/components/LoadingButton";
import { ErrorAlert } from "@/components/ErrorAlert";
import { OrbiTrustLogo } from "@/components/OrbiTrustLogo";
import { Stamp } from "@/components/Stamp";
import { formatAmount } from "@/lib/format";
import {
  type SimulatorProduct,
  platformLabel,
} from "@/lib/simulator/catalog";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Zap,
} from "@/components/icons";

type MerchantView = {
  id: string;
  handle: string;
  name: string;
  platform: "orbitienda" | "shopify";
  platformLabel: string;
  sellerAddress: `0x${string}`;
  ready: boolean;
};

type CatalogResponse = {
  merchants: MerchantView[];
  products: SimulatorProduct[];
};

type SyncStep = "webhook" | "prepare" | "sign" | "create" | "done";

const PLATFORM_LOGOS = {
  orbitienda: {
    src: "https://public.orbitienda.com/logo.png",
    className: "object-contain object-left p-0.5",
  },
  shopify: {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/1280px-Shopify_logo_2018.svg.png",
    className: "object-contain object-left p-1",
  },
} as const;

const FLOW_STEPS = [
  { id: "platform", label: "Plataforma" },
  { id: "webhook", label: "Webhook" },
  { id: "service", label: "OrbiTrust" },
] as const;

const SYNC_STEPS: { id: SyncStep; label: string }[] = [
  { id: "webhook", label: "Evento de venta pagada" },
  { id: "prepare", label: "POST /api/orders/prepare" },
  { id: "sign", label: "Firma de la tienda (integración)" },
  { id: "create", label: "POST /api/orders" },
  { id: "done", label: "Link de reseña generado" },
];

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { ok?: boolean; error?: string };
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

function webhookEventLabel(platform: MerchantView["platform"]): string {
  return platform === "orbitienda" ? "order.paid" : "orders/paid";
}

function buildWebhookPayload(
  merchant: MerchantView,
  product: SimulatorProduct
): Record<string, unknown> {
  if (merchant.platform === "shopify") {
    return {
      topic: "orders/paid",
      shop_domain: `${merchant.handle}.myshopify.com`,
      order: {
        id: `#DEMO-${product.id.slice(-4).toUpperCase()}`,
        name: product.name,
        total_price: String(product.priceArs),
        currency: "ARS",
        financial_status: "paid",
      },
    };
  }

  return {
    event: "order.paid",
    store: merchant.handle,
    order: {
      id: `demo-${product.id}`,
      product: product.name,
      total: product.priceArs,
      currency: "ARS",
      status: "paid",
    },
  };
}

function ProductPhoto({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-paper-2">
        <span className="px-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-3">
          {label}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover"
      sizes="(max-width: 768px) 50vw, 280px"
      onError={() => setFailed(true)}
    />
  );
}

function ProductCard({
  product,
  selected,
  onSelect,
}: {
  product: SimulatorProduct;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-full min-h-0 flex-col overflow-hidden border text-left transition ${
        selected
          ? "border-violet ring-2 ring-violet/25"
          : "border-line bg-surface hover:border-line-2"
      }`}
    >
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-paper-2">
        <ProductPhoto src={product.imageUrl} label={product.category} />
      </div>
      <div className="flex min-h-[7.5rem] flex-1 flex-col p-4 sm:p-5">
        <p className="eyebrow">{product.category}</p>
        <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug text-ink sm:text-lg">
          {product.name}
        </h3>
        <p className="figure mt-auto pt-4 text-xl text-ink sm:text-2xl">
          ${formatAmount(product.priceArs)}
        </p>
      </div>
    </button>
  );
}

function FlowBanner({ platformLabel: platform }: { platformLabel: string | null }) {
  return (
    <div className="mt-6 border border-line bg-paper-2/50 p-4 sm:p-5">
      <p className="eyebrow mb-4">Flujo de integración</p>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {FLOW_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3 sm:gap-4">
            <div
              className={`flex items-center gap-2.5 border px-3 py-2 sm:px-4 ${
                step.id === "platform"
                  ? "border-line bg-surface"
                  : step.id === "webhook"
                    ? "border-violet/30 bg-violet-soft/20"
                    : "border-verified-line bg-verified-soft/30"
              }`}
            >
              {step.id === "platform" ? (
                <StoreIcon className="h-4 w-4 text-ink-3" />
              ) : step.id === "webhook" ? (
                <Zap className="h-4 w-4 text-violet" />
              ) : (
                <OrbiTrustLogo variant="dark" className="h-4 w-auto" />
              )}
              <div>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-3">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="text-sm font-semibold text-ink sm:text-base">
                  {step.id === "platform" && platform ? platform : step.label}
                </p>
              </div>
            </div>
            {index < FLOW_STEPS.length - 1 ? (
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-ink-3 sm:block" />
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-2 sm:text-base">
        Elegí una tienda y un producto. Al simular, enviamos el mismo payload que
        recibiría tu backend cuando{" "}
        <span className="font-medium text-ink">
          {platform ?? "Orbitienda o Shopify"}
        </span>{" "}
        avisa una venta pagada hacia la API de OrbiTrust.
      </p>
    </div>
  );
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9l1-4h14l1 4" />
      <path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 10v9h14v-9" />
    </svg>
  );
}

function WebhookPayloadPreview({
  merchant,
  product,
}: {
  merchant: MerchantView;
  product: SimulatorProduct;
}) {
  const payload = useMemo(
    () => buildWebhookPayload(merchant, product),
    [merchant, product]
  );
  const event = webhookEventLabel(merchant.platform);

  return (
    <div className="mt-4 border border-line bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-3">
          Payload del webhook
        </span>
        <span className="tag border-violet/20 bg-violet-soft/30 font-mono text-[0.65rem] text-violet">
          {event}
        </span>
      </div>
      <pre className="max-h-44 overflow-auto p-3 font-mono text-[0.68rem] leading-relaxed text-ink-2 sm:text-xs">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}

function ApiDestination() {
  return (
    <div className="mt-4 space-y-2">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-3">
        Destino en OrbiTrust
      </p>
      <div className="space-y-1.5 font-mono text-[0.68rem] text-ink-2 sm:text-xs">
        <p className="border border-line bg-paper px-2.5 py-2">
          <span className="text-verified">POST</span> /api/orders/prepare
        </p>
        <p className="border border-line bg-paper px-2.5 py-2">
          <span className="text-verified">POST</span> /api/orders
        </p>
      </div>
    </div>
  );
}

function SyncProgress({ currentStep }: { currentStep: SyncStep }) {
  const currentIndex = SYNC_STEPS.findIndex((step) => step.id === currentStep);

  return (
    <ul className="mt-5 space-y-2.5">
      {SYNC_STEPS.map((step, index) => {
        const done = index < currentIndex || currentStep === "done";
        const active = index === currentIndex && currentStep !== "done";

        return (
          <li
            key={step.id}
            className={`flex items-start gap-2.5 text-sm leading-snug ${
              done ? "text-ink" : active ? "text-ink" : "text-ink-3"
            }`}
          >
            {done ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-verified" />
            ) : active ? (
              <span className="mt-1 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-violet" />
            ) : (
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-line-2" />
            )}
            <span className={active ? "font-medium" : undefined}>{step.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function SimuladorClient() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SimulatorProduct | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [reviewPath, setReviewPath] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "syncing" | "done">("idle");
  const [syncStep, setSyncStep] = useState<SyncStep>("webhook");

  const loadCatalog = useCallback(async () => {
    setLoadError(null);
    setLoadingCatalog(true);
    try {
      const res = await fetch("/api/simulator/merchants", { cache: "no-store" });
      const data = await parseJson<CatalogResponse>(res);
      setCatalog(data);
      setMerchantId((current) => {
        if (current && data.merchants.some((m) => m.id === current)) return current;
        return data.merchants[0]?.id ?? null;
      });
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const merchant = useMemo(
    () => catalog?.merchants.find((m) => m.id === merchantId) ?? null,
    [catalog, merchantId]
  );

  const products = useMemo(
    () => catalog?.products.filter((p) => p.merchantId === merchantId) ?? [],
    [catalog, merchantId]
  );

  async function simulateOrder() {
    if (!selectedProduct || !merchant?.sellerAddress) return;

    setRunning(true);
    setRunError(null);
    setReviewPath(null);
    setOrderId(null);
    setPhase("syncing");
    setSyncStep("webhook");

    const product = selectedProduct;
    const sellerAddress = merchant.sellerAddress;

    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setSyncStep("prepare");

      const prepareRes = await fetch("/api/orders/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seller: sellerAddress }),
      });
      const prepared = await parseJson<{
        token: string;
        buyer: `0x${string}`;
        nonce: string;
      }>(prepareRes);

      setSyncStep("sign");

      const signRes = await fetch("/api/simulator/sign-create-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sellerAddress,
          productId: product.id,
          token: prepared.token,
          buyer: prepared.buyer,
          nonce: prepared.nonce,
        }),
      });
      const signed = await parseJson<{
        signature: `0x${string}`;
        payload: { buyer: string; amount: string; metadataHash: string };
      }>(signRes);

      setSyncStep("create");

      const createRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: prepared.token,
          payload: signed.payload,
          nonce: prepared.nonce,
          signature: signed.signature,
        }),
      });
      const created = await parseJson<{
        orderId: number;
        reviewPath?: string;
        confirmPath?: string;
      }>(createRes);

      setOrderId(created.orderId);
      setReviewPath(created.reviewPath ?? created.confirmPath ?? null);
      setSyncStep("done");
      setPhase("done");
      await loadCatalog();
    } catch (err) {
      setPhase("idle");
      setSyncStep("webhook");
      setRunError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  function resetFlow() {
    setPhase("idle");
    setSyncStep("webhook");
    setReviewPath(null);
    setOrderId(null);
    setRunError(null);
  }

  function selectMerchant(id: string) {
    setMerchantId(id);
    setSelectedProduct(null);
    resetFlow();
  }

  function selectProduct(product: SimulatorProduct) {
    setSelectedProduct(product);
    resetFlow();
  }

  const reviewUrl =
    reviewPath && typeof window !== "undefined"
      ? `${window.location.origin}${reviewPath}`
      : reviewPath;

  return (
    <div className="container-app py-8 sm:py-10">
      <header className="border-b border-line pb-6">
        <p className="eyebrow-lg">Demo en vivo · Integración</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-ink">
            Simulador de webhook
          </h1>
          <p className="max-w-md text-base text-ink-2 sm:text-lg">
            Orbitienda o Shopify avisan una venta → OrbiTrust registra y devuelve
            el link de reseña.
          </p>
        </div>
      </header>

      {!loadingCatalog && !loadError && catalog && catalog.merchants.length > 0 ? (
        <FlowBanner platformLabel={merchant ? platformLabel(merchant.platform) : null} />
      ) : null}

      {loadingCatalog ? (
        <div className="mt-8 flex flex-col gap-4">
          <div className="grid min-h-[420px] gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] xl:gap-6">
            <div className="animate-pulse border border-line bg-paper-2/60" />
            <div className="animate-pulse border border-line bg-paper-2/60" />
          </div>
          <div className="animate-pulse border border-line bg-paper-2/60 min-h-[12rem]" />
        </div>
      ) : loadError ? (
        <div className="mt-8 max-w-xl">
          <ErrorAlert title="No se pudo cargar" message={loadError} />
        </div>
      ) : catalog && catalog.merchants.length === 0 ? (
        <div className="mx-auto mt-10 max-w-lg border border-line bg-surface p-8 text-center sm:p-10">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">Sin tiendas todavía</h2>
          <p className="mt-3 text-base text-ink-2">
            Registrá una tienda en el panel y volvé acá para simular el webhook de una
            venta.
          </p>
          <Link href="/onboarding" className="btn-primary btn-lg mt-8 inline-flex">
            Crear tienda
          </Link>
        </div>
      ) : catalog ? (
        <div className="mt-8 flex flex-col gap-6 xl:gap-8">
          <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] xl:gap-8">
            <aside>
              <p className="eyebrow mb-1">Paso 1</p>
              <h2 className="mb-4 text-base font-semibold text-ink">Origen del webhook</h2>
              <ul className="space-y-2.5">
                {catalog.merchants.map((store) => {
                  const active = merchantId === store.id;
                  const logo = PLATFORM_LOGOS[store.platform];
                  return (
                    <li key={store.id}>
                      <button
                        type="button"
                        onClick={() => selectMerchant(store.id)}
                        className={`w-full border p-4 text-left transition ${
                          active
                            ? "border-violet bg-violet-soft/30"
                            : "border-line bg-surface hover:border-line-2"
                        }`}
                      >
                        <div className="relative mb-3 h-7 w-[5.5rem]">
                          <Image
                            src={logo.src}
                            alt=""
                            fill
                            className={logo.className}
                            sizes="88px"
                          />
                        </div>
                        <p className="truncate text-base font-semibold leading-tight text-ink">
                          {store.name}
                        </p>
                        <p className="mt-1 truncate text-sm text-ink-3">@{store.handle}</p>
                        <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-ink-3">
                          {webhookEventLabel(store.platform)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <section className="min-w-0">
              <p className="eyebrow mb-1">Paso 2</p>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl text-ink">Evento de venta</h2>
                {merchant ? (
                  <>
                    <span className="text-ink-3">·</span>
                    <span className="text-base text-ink-2">{merchant.name}</span>
                    <span className="tag border-verified-line bg-verified-soft text-verified-ink">
                      {platformLabel(merchant.platform)}
                    </span>
                  </>
                ) : null}
              </div>
              <p className="mb-5 max-w-2xl text-sm leading-relaxed text-ink-2 sm:text-base">
                Elegí el producto vendido. Representa el ítem que viaja en el webhook
                cuando el comprador paga.
              </p>

              <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selected={selectedProduct?.id === product.id}
                    onSelect={() => selectProduct(product)}
                  />
                ))}
              </div>
            </section>
          </div>

          <section>
            <p className="eyebrow mb-1">Paso 3</p>
            <h2 className="mb-4 text-base font-semibold text-ink">OrbiTrust recibe</h2>
            <div className="border border-line bg-surface p-5 sm:p-6">
              {phase === "done" && reviewPath ? (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <Stamp tone="verified">
                      <BadgeCheck className="h-4 w-4" />
                      Webhook procesado
                    </Stamp>
                    <p className="font-display mt-6 text-3xl text-ink sm:text-4xl">
                      Orden #{orderId?.toString().padStart(4, "0")}
                    </p>
                    <p className="mt-2 max-w-xl text-base text-ink-2 sm:text-lg">
                      La API respondió con el link de reseña para el comprador.
                    </p>
                    <div className="mt-4 max-w-2xl border border-line bg-paper px-3 py-2">
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-3">
                        Respuesta
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-ink-2 sm:text-sm">
                        reviewPath: {reviewPath}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:min-w-[14rem]">
                    <a
                      href={reviewUrl ?? reviewPath}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary btn-lg inline-flex w-full sm:w-auto lg:w-full"
                    >
                      Abrir reseña
                      <ArrowRight className="h-5 w-5" />
                    </a>
                    <button
                      type="button"
                      onClick={resetFlow}
                      className="btn-secondary btn-lg w-full sm:w-auto lg:w-full"
                    >
                      Otro webhook
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {merchant && selectedProduct ? (
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start xl:gap-8">
                      <div>
                        <WebhookPayloadPreview merchant={merchant} product={selectedProduct} />
                        <ApiDestination />
                      </div>

                      <div className="flex min-h-[12rem] flex-col border border-line bg-paper p-5 sm:p-6">
                        {phase === "syncing" ? (
                          <>
                            <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-3">
                              Procesando
                            </p>
                            <SyncProgress currentStep={syncStep} />
                          </>
                        ) : (
                          <>
                            <p className="text-base leading-relaxed text-ink-2">
                              Enviá el webhook simulado hacia la API de OrbiTrust.
                            </p>
                            <LoadingButton
                              loading={running}
                              onClick={simulateOrder}
                              disabled={!merchant?.ready}
                              className="btn-lg mt-auto w-full"
                            >
                              <Zap className="h-4 w-4" />
                              Enviar webhook simulado
                            </LoadingButton>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[10rem] flex-col items-center justify-center text-center sm:min-h-[12rem]">
                      <div className="flex h-12 w-12 items-center justify-center border border-line bg-paper">
                        <Zap className="h-5 w-5 text-ink-3" />
                      </div>
                      <p className="mt-4 max-w-md text-base leading-relaxed text-ink-2">
                        Elegí tienda y producto para ver el payload y pegarle al
                        servicio.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <ErrorAlert title="No se pudo simular" message={runError} />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
