"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrder } from "@/lib/hooks";
import { OrderStatus, metadataHashToLabel, orderNo } from "@/lib/orbitrust";
import { formatAmount } from "@/lib/format";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { LoadingButton } from "./LoadingButton";
import { ArrowRight } from "@/components/icons";

export function SellerOrderRow({
  orderId,
  sellerAddress,
  actionable = false,
  onChanged,
}: {
  orderId: bigint;
  sellerAddress?: `0x${string}`;
  actionable?: boolean;
  onChanged?: () => void;
}) {
  const { order, isLoading, refetch } = useOrder(orderId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !order) {
    return <div className="h-[88px] animate-pulse rounded-md bg-paper-2" />;
  }

  const isSeller =
    actionable &&
    sellerAddress &&
    order.seller.toLowerCase() === sellerAddress.toLowerCase();

  const canCancel =
    isSeller &&
    order.status !== OrderStatus.Cancelled &&
    !order.reviewed;

  async function runAction(action: "cancel") {
    setError(null);
    setBusy(true);
    try {
      const path = `/api/sellers/orders/${orderId.toString()}/cancel`;
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "No se pudo completar la acción.");
      }
      await refetch();
      onChanged?.();
    } catch (err) {
      setError((err as Error)?.message || "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-line bg-surface p-4 transition hover:border-line-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="eyebrow">No.</span>
            <span className="figure text-sm text-ink">{orderNo(orderId)}</span>
            <OrderStatusBadge status={order.status} reviewed={order.reviewed} />
          </div>
          <p className="mt-1.5 truncate text-sm text-ink">
            {metadataHashToLabel(order.metadataHash)}
          </p>
          <p className="mt-0.5 text-xs text-ink-3">
            Monto{" "}
            <span className="figure text-ink-2">{formatAmount(order.amount)}</span>
            {order.reviewed ? " · Reseña verificada" : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCancel && (
            <LoadingButton
              variant="secondary"
              loading={busy}
              onClick={() => runAction("cancel")}
            >
              Cancelar
            </LoadingButton>
          )}
          <Link
            href={`/order/${orderId.toString()}`}
            className="btn-secondary"
            aria-label="Abrir orden"
          >
            Abrir <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-danger-ink">{error}</p>}
    </div>
  );
}
