"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSeller, useTrustScore, useSellerOrderIds } from "@/lib/hooks";
import { isValidAddress, formatRating } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";
import { Eyebrow } from "@/components/Eyebrow";
import { SellerStatsCard } from "@/components/SellerStatsCard";
import { TrustScoreCard } from "@/components/TrustScoreCard";
import { SellerOrderRow } from "@/components/SellerOrderRow";
import { ConfigWarning } from "@/components/ConfigWarning";
import { IS_CONTRACT_CONFIGURED } from "@/lib/contract/config";

export default function SellerProfilePage() {
  const params = useParams<{ address: string }>();
  const raw = (params?.address ?? "") as string;
  const valid = isValidAddress(raw);
  const address = valid ? (raw as `0x${string}`) : undefined;

  const mounted = useMounted();
  const { seller, refetch: refetchSeller, isLoading } = useSeller(address);
  const { trustScore, refetch: refetchScore } = useTrustScore(address);
  const { orderIds, refetch: refetchOrders } = useSellerOrderIds(address);

  const exists = Boolean(seller?.exists);
  const orderList = orderIds ? [...orderIds].reverse() : [];

  function refetchAll() {
    refetchSeller();
    refetchScore();
    refetchOrders();
  }

  if (!valid) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="font-display text-2xl text-ink">
          Perfil no encontrado
        </h1>
        <Link href="/" className="link mt-4 inline-block">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-12">
      <Link
        href="/dashboard"
        className="text-sm text-ink-3 transition hover:text-ink"
      >
        ← Volver al panel
      </Link>

      <div className="mt-4">
        <ConfigWarning />
      </div>

      {!mounted || (IS_CONTRACT_CONFIGURED && isLoading) ? (
        <div className="card mt-4 h-48 animate-pulse" />
      ) : !exists ? (
        <div className="card card-pad mt-4 text-center">
          <h1 className="font-display text-2xl text-ink">
            Acá no hay vendedor registrado
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
            Esta tienda todavía no tiene un perfil de vendedor en OrbiTrust.
          </p>
          <Link href="/dashboard" className="btn-primary mt-5 inline-flex">
            Crear un perfil de vendedor
          </Link>
        </div>
      ) : (
        seller && (
          <div className="mt-4 space-y-6">
            <SellerStatsCard
              handle={seller.handle}
              address={address}
              completedSales={seller.completedSales}
              reviewsCount={seller.reviewsCount}
              averageRating={formatRating(seller.ratingSum, seller.reviewsCount)}
              trustScore={trustScore !== undefined ? Number(trustScore) : 0}
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
              <div>
                <Eyebrow>Registro público</Eyebrow>
                <h2 className="font-display mt-2 text-2xl text-ink">
                  Ventas verificadas
                </h2>
                <p className="mt-1.5 text-sm text-ink-2">
                  Esta reputación se construye con ventas completadas y reseñadas,
                  no con opiniones sueltas.
                </p>
                <div className="mt-4 space-y-3">
                  {orderList.length === 0 ? (
                    <div className="card card-pad text-center text-sm text-ink-3">
                      Todavía no hay ventas verificadas.
                    </div>
                  ) : (
                    orderList.map((id) => (
                      <SellerOrderRow
                        key={id.toString()}
                        orderId={id}
                        actionable={false}
                        onChanged={refetchAll}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <TrustScoreCard
                  score={
                    trustScore !== undefined ? Number(trustScore) : undefined
                  }
                />
                <div className="card card-pad">
                  <Eyebrow>Cómo funciona</Eyebrow>
                  <p className="mt-3 text-sm leading-relaxed text-ink">
                    Las reseñas prueban que alguien escribió una opinión. OrbiTrust
                    prueba que existió una operación comercial.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">
                    Cada venta y reseña verificada queda en un historial auditable,
                    portable entre canales y plataformas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
