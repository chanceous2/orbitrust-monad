"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IS_CONTRACT_CONFIGURED } from "@/lib/contract/config";
import { useOrder } from "@/lib/hooks";
import { useSellerSession } from "@/lib/sellers/useSellerSession";
import { useSession } from "@/lib/auth/client";
import { OrderStatus, metadataHashToLabel, orderNo } from "@/lib/orbitrust";
import { shortAddress, formatAmount, formatTimestamp } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";
import { Eyebrow } from "@/components/Eyebrow";
import { Sheet } from "@/components/Sheet";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderLifecycleStepper } from "@/components/OrderLifecycleStepper";
import { TransactionResult } from "@/components/TransactionResult";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingButton } from "@/components/LoadingButton";
import { ConfigWarning } from "@/components/ConfigWarning";
import { SponsorWarning } from "@/components/SponsorWarning";
import { CopyButton } from "@/components/CopyButton";
import { ArrowUpRight } from "@/components/icons";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-line py-3 last:border-0">
      <span className="text-sm text-ink-3">{label}</span>
      <span className="text-right text-sm text-ink">{children}</span>
    </div>
  );
}

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const idParam = (params?.id ?? "") as string;
  const idValid = /^\d+$/.test(idParam);
  const orderId = idValid ? BigInt(idParam) : undefined;

  const mounted = useMounted();
  const { data: session } = useSession();
  const { profile } = useSellerSession(Boolean(session?.user));
  const { order, isLoading, error, refetch } = useOrder(orderId);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [confirmed, setConfirmed] = useState(false);

  const sellerAddress = profile?.sellerAddress;
  const isSeller =
    sellerAddress &&
    order &&
    order.seller.toLowerCase() === sellerAddress.toLowerCase();

  async function runSellerCancel() {
    if (orderId === undefined) return;
    setActionError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/sellers/orders/${orderId.toString()}/cancel`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        hash?: `0x${string}`;
      };
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "No se pudo completar la acción.");
      }
      if (data.hash) {
        setHash(data.hash);
        setConfirmed(true);
      }
      await refetch();
    } catch (err) {
      setActionError((err as Error)?.message || "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  if (!idValid) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Orden inválida</h1>
        <Link href="/dashboard" className="link mt-4 inline-block">
          Volver al panel
        </Link>
      </div>
    );
  }

  const canCancel =
    isSeller &&
    order &&
    !order.reviewed &&
    order.status !== OrderStatus.Cancelled;

  return (
    <div className="container-app py-12">
      <Link
        href="/dashboard"
        className="text-sm text-ink-3 transition hover:text-ink"
      >
        ← Volver al panel
      </Link>

      <div className="mt-4 space-y-3">
        <ConfigWarning />
        <SponsorWarning />
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Venta verificada</Eyebrow>
          <h1 className="figure mt-1.5 text-4xl text-ink">
            No. {orderNo(idParam)}
          </h1>
        </div>
        {order && (
          <OrderStatusBadge status={order.status} reviewed={order.reviewed} />
        )}
      </div>

      {!IS_CONTRACT_CONFIGURED ? (
        <div className="card card-pad mt-6 text-center">
          <p className="text-lg font-semibold text-ink">Servicio no disponible</p>
          <p className="mt-1 text-sm text-ink-2">
            Configurá OrbiTrust en este entorno para ver órdenes.
          </p>
        </div>
      ) : error ? (
        <div className="card card-pad mt-6 text-center">
          <p className="text-lg font-semibold text-ink">Orden no encontrada</p>
          <p className="mt-1 text-sm text-ink-2">
            Este número de orden no existe en el sistema.
          </p>
        </div>
      ) : isLoading || !order ? (
        <div className="card mt-6 h-64 animate-pulse" />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="space-y-6">
            <div className="card card-pad">
              <Eyebrow>Ciclo de vida</Eyebrow>
              <div className="mt-6">
                <OrderLifecycleStepper
                  status={order.status}
                  reviewed={order.reviewed}
                />
              </div>
            </div>

            <div className="card card-pad">
              <Eyebrow>Acciones del vendedor</Eyebrow>

              {!mounted ? (
                <div className="mt-4 h-11 animate-pulse rounded-md bg-paper-2" />
              ) : !session?.user ? (
                <p className="mt-3 text-sm text-ink-2">
                  <Link href="/login" className="link">
                    Entrá
                  </Link>{" "}
                  para gestionar esta orden. El comprador reseña desde su link,
                  sin crear cuenta.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {canCancel && (
                    <LoadingButton
                      variant="secondary"
                      loading={busy}
                      onClick={runSellerCancel}
                      className="w-full"
                    >
                      Cancelar orden
                    </LoadingButton>
                  )}

                  {!order.reviewed && order.status !== OrderStatus.Cancelled && (
                    <p className="text-sm text-ink-2">
                      Compartí el link de reseña cuando entregues el producto.
                      La reseña cierra la venta y actualiza la reputación.
                    </p>
                  )}
                  {order.reviewed && (
                    <p className="text-sm text-verified-ink">
                      Venta completada y reseñada. Reputación actualizada.
                    </p>
                  )}
                  {order.status === OrderStatus.Cancelled && (
                    <p className="text-sm text-ink-2">Esta orden fue cancelada.</p>
                  )}
                  {!isSeller && order.status !== OrderStatus.Cancelled && !order.reviewed && (
                    <p className="text-sm text-ink-3">
                      Solo el vendedor de esta orden puede cancelarla acá.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 space-y-3">
                <TransactionResult hash={hash} confirmed={confirmed} sponsored />
                <ErrorAlert title="No se pudo completar" message={actionError} />
              </div>
            </div>
          </div>

          <Sheet className="h-fit p-6 sm:p-7">
            <Eyebrow>Detalle de la orden</Eyebrow>
            <div className="mt-3">
              <DetailRow label="Orden">
                <span className="figure">No. {orderNo(order.id)}</span>
              </DetailRow>
              <DetailRow label="Vendedor">
                <Link
                  href={`/seller/${order.seller}`}
                  className="link figure inline-flex items-center gap-1"
                >
                  {shortAddress(order.seller)}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </DetailRow>
              <DetailRow label="Comprador">
                <span className="inline-flex items-center gap-1.5">
                  <span className="figure">{shortAddress(order.buyer)}</span>
                  <CopyButton value={order.buyer} />
                </span>
              </DetailRow>
              <DetailRow label="Monto">
                <span className="figure">{formatAmount(order.amount)}</span>
              </DetailRow>
              <DetailRow label="Ítem">
                {metadataHashToLabel(order.metadataHash)}
              </DetailRow>
              <DetailRow label="Creada">
                {formatTimestamp(order.createdAt)}
              </DetailRow>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-ink-3">
              Una reseña verificada cierra la venta y prueba que hubo una
              operación comercial real entre comprador y vendedor.
            </p>
          </Sheet>
        </div>
      )}
    </div>
  );
}
