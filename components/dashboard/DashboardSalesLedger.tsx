import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Eyebrow } from "@/components/Eyebrow";
import { SellerOrderRow } from "@/components/SellerOrderRow";

export function DashboardSalesLedger({
  orderIds,
  sellerAddress,
  onChanged,
}: {
  orderIds: bigint[];
  sellerAddress: `0x${string}`;
  onChanged: () => void;
}) {
  return (
    <section aria-labelledby="dashboard-sales-heading" className="mt-14 sm:mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <Eyebrow>Registro</Eyebrow>
          <h2
            id="dashboard-sales-heading"
            className="font-display mt-2 text-2xl text-ink sm:text-[1.75rem]"
          >
            Ventas verificadas
          </h2>
        </div>
        <span className="figure text-sm text-ink-3">{orderIds.length} en total</span>
      </div>

      <div className="mt-5 space-y-3">
        {orderIds.length === 0 ? (
          <div className="border border-dashed border-line-2 bg-paper-2/40 px-6 py-10 sm:px-10 sm:py-12">
            <p className="font-display text-xl text-ink sm:text-2xl">
              Todavía no hay ventas en tu registro
            </p>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-ink-2">
              Cuando cierres una venta con reseña del comprador, aparece acá como
              comprobante verificable — prueba de que la operación fue real.
            </p>
            <Link
              href="/simulador"
              className="link mt-6 inline-flex items-center gap-1.5 text-sm font-medium"
            >
              Probar con una venta de demo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          orderIds.map((id) => (
            <SellerOrderRow
              key={id.toString()}
              orderId={id}
              sellerAddress={sellerAddress}
              actionable
              onChanged={onChanged}
            />
          ))
        )}
      </div>
    </section>
  );
}
