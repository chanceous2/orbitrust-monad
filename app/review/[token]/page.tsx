"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatAmount, shortAddress } from "@/lib/format";
import { metadataHashDetail, metadataHashToLabel } from "@/lib/orbitrust";
import { Eyebrow } from "@/components/Eyebrow";
import { Sheet } from "@/components/Sheet";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderLifecycleStepper } from "@/components/OrderLifecycleStepper";
import { LoadingButton } from "@/components/LoadingButton";
import { ErrorAlert } from "@/components/ErrorAlert";
import { SponsorBadge } from "@/components/SponsorBadge";
import { Star, ArrowUpRight, BadgeCheck } from "@/components/icons";

type OrderView = {
  order: {
    orderId: number;
    orderNo: string;
    seller: `0x${string}`;
    sellerHandle: string | null;
    amount: string;
    description: string;
    status: number;
    statusName: string;
    reviewed: boolean;
    createdAt: number;
    expiresAt: number;
  };
  nextAction: "review" | null;
  actionsDone: Record<string, string | null>;
  relayer: string | null;
  sponsored: boolean;
};

function ReviewLoadingShell() {
  return (
    <Sheet className="card-pad-lg overflow-hidden" marks={false}>
      <div className="animate-pulse space-y-6">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-line-2" />
          <div className="h-10 w-4/5 max-w-md rounded bg-line-2" />
          <div className="h-4 w-40 rounded bg-line-2" />
        </div>
        <div className="rule-dashed opacity-50" />
        <div className="flex justify-between gap-4">
          <div className="h-4 w-16 rounded bg-line-2" />
          <div className="h-6 w-24 rounded bg-line-2" />
        </div>
        <div className="flex justify-between gap-4">
          <div className="h-4 w-16 rounded bg-line-2" />
          <div className="h-8 w-28 rounded bg-line-2" />
        </div>
        <div className="flex justify-center gap-8 pt-2">
          <div className="h-8 w-8 rounded-full bg-line-2" />
          <div className="h-8 w-8 rounded-full bg-line-2" />
        </div>
        <div className="rounded-lg border border-line bg-paper-2/60 p-6 sm:p-8">
          <div className="h-5 w-48 rounded bg-line-2" />
          <div className="mt-6 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-10 rounded bg-line-2" />
            ))}
          </div>
          <div className="mt-6 h-14 w-full rounded-lg bg-line-2" />
          <div className="mt-6 h-14 w-full rounded-lg bg-line-2/80" />
        </div>
      </div>
      <p className="mt-8 text-center font-mono text-sm uppercase tracking-[0.14em] text-ink-3">
        Cargando tu compra…
      </p>
    </Sheet>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          className={`rounded-lg p-1.5 transition sm:p-2 ${
            n <= value ? "text-amber" : "text-ink-3 hover:text-ink-2"
          }`}
        >
          <Star className={`h-10 w-10 sm:h-12 sm:w-12 ${n <= value ? "fill-amber" : ""}`} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const params = useParams<{ token: string }>();
  const token = (params?.token ?? "") as string;

  const [view, setView] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tx, setTx] = useState<{ hash: string; explorerUrl: string } | null>(null);

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/orders/${token}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setLoadError(data.error || "No se pudo cargar la orden.");
        setView(null);
      } else {
        setView(data as OrderView);
      }
    } catch {
      setLoadError("No se pudo cargar la orden.");
      setView(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitReview() {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/orders/${token}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating, text: reviewText }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setActionError(data.error || "No se pudo enviar la reseña.");
      } else {
        setTx({ hash: data.hash, explorerUrl: data.explorerUrl });
        await load();
      }
    } catch {
      setActionError("No se pudo enviar la reseña. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-centered">
      <div className="container-narrow w-full max-w-2xl">
        <p className="mb-6 text-center font-mono text-sm uppercase tracking-[0.16em] text-violet-ink sm:text-base">
          Reseña verificada · sin registro
        </p>

        {loading ? (
          <ReviewLoadingShell />
        ) : loadError || !view ? (
          <Sheet className="card-pad-lg text-center" marks={false}>
            <h1 className="font-display text-3xl text-ink sm:text-4xl">
              No pudimos abrir tu compra
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-ink-2 sm:text-lg">
              {loadError ?? "El link no es válido o expiró."}
            </p>
            <Link href="/" className="btn-primary btn-lg mt-8 inline-flex">
              Ir a OrbiTrust
            </Link>
          </Sheet>
        ) : (
          <ReviewContent
            view={view}
            busy={busy}
            actionError={actionError}
            tx={tx}
            rating={rating}
            setRating={setRating}
            reviewText={reviewText}
            setReviewText={setReviewText}
            onSubmit={submitReview}
          />
        )}
      </div>
    </div>
  );
}

function ReviewContent({
  view,
  busy,
  actionError,
  tx,
  rating,
  setRating,
  reviewText,
  setReviewText,
  onSubmit,
}: {
  view: OrderView;
  busy: boolean;
  actionError: string | null;
  tx: { hash: string; explorerUrl: string } | null;
  rating: number;
  setRating: (n: number) => void;
  reviewText: string;
  setReviewText: (s: string) => void;
  onSubmit: () => void;
}) {
  const { order, nextAction } = view;
  const sellerName = order.sellerHandle ? `@${order.sellerHandle}` : shortAddress(order.seller);
  const done = order.reviewed || Boolean(tx);
  const productTitle = metadataHashToLabel(order.description);
  const productDetail = metadataHashDetail(order.description);

  return (
    <Sheet className="card-pad-lg overflow-hidden" marks={false}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Eyebrow className="eyebrow-lg">Tu compra</Eyebrow>
          <h1 className="font-display mt-3 break-words text-[clamp(1.75rem,4vw,2.5rem)] leading-tight text-ink">
            {productTitle}
          </h1>
          {productDetail ? (
            <p className="mt-2 text-base leading-relaxed text-ink-2 sm:text-lg">
              {productDetail}
            </p>
          ) : null}
          <p className="mt-3 text-base text-ink-2 sm:text-lg">
            Tienda{" "}
            <Link href={`/seller/${order.seller}`} className="link font-medium text-ink">
              {sellerName}
            </Link>
          </p>
        </div>
        <div className="shrink-0 self-start">
          <OrderStatusBadge status={order.status} reviewed={order.reviewed} />
        </div>
      </div>

      <div className="rule-dashed my-7 sm:my-8" />

      <dl className="grid grid-cols-2 gap-4 sm:gap-6">
        <div>
          <dt className="eyebrow">Orden</dt>
          <dd className="figure mt-2 text-2xl text-ink sm:text-3xl">No. {order.orderNo}</dd>
        </div>
        <div className="text-right">
          <dt className="eyebrow">Total</dt>
          <dd className="figure mt-2 text-2xl text-ink sm:text-3xl">
            ${formatAmount(order.amount)}
          </dd>
        </div>
      </dl>

      <div className="mt-8 sm:mt-10">
        <OrderLifecycleStepper status={order.status} reviewed={order.reviewed} size="lg" />
      </div>

      <div className="mt-8 rounded-lg border border-line bg-paper-2/50 p-6 sm:mt-10 sm:p-8">
        {done ? (
          <div className="flex flex-col items-center space-y-5 text-center">
            <BadgeCheck className="h-10 w-10 shrink-0 text-verified sm:h-12 sm:w-12" />
            <div>
              <p className="text-xl font-semibold text-ink sm:text-2xl">
                ¡Gracias por tu reseña!
              </p>
              <p className="mt-3 text-base leading-relaxed text-ink-2 sm:text-lg">
                La venta quedó verificada y sumó reputación a la tienda.
              </p>
            </div>
            <SponsorBadge />
            {tx ? (
              <a
                href={tx.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="link inline-flex items-center gap-1.5 text-base"
              >
                Ver registro público <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        ) : nextAction === "review" ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink sm:text-2xl">
                ¿Cómo fue tu experiencia?
              </h2>
              <p className="mt-2 text-base text-ink-2 sm:text-lg">
                Tu reseña cierra la compra y queda verificada.
              </p>
            </div>

            <div>
              <p className="field-label-lg">Calificación</p>
              <div className="mt-3">
                <StarPicker value={rating} onChange={setRating} />
              </div>
            </div>

            <div>
              <label className="field-label-lg" htmlFor="review">
                Comentario (opcional)
              </label>
              <input
                id="review"
                className="input-lg mt-2"
                placeholder="Excelente vendedor, llegó rápido"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={120}
              />
            </div>

            <LoadingButton loading={busy} onClick={onSubmit} className="btn-lg w-full">
              Publicar reseña
            </LoadingButton>
          </div>
        ) : (
          <p className="text-center text-base text-ink-2 sm:text-lg">
            Esta compra ya no acepta reseñas.
          </p>
        )}

        <ErrorAlert title="No se pudo completar" message={actionError} />
      </div>
    </Sheet>
  );
}
