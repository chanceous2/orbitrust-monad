"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/Eyebrow";
import { Zap } from "@/components/icons";
import { nextPlan, type TenantPlan } from "@/lib/tenant/plans";
import type { TenantView } from "@/lib/sponsored/client";

function formatLimit(limit: number | null): string {
  return limit === null ? "∞" : String(limit);
}

export function PlanCard({
  tenant,
  loading = false,
}: {
  tenant: TenantView | null;
  loading?: boolean;
}) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (loading || !tenant) {
    return <div className="card h-40 animate-pulse" />;
  }

  const { planInfo, usage, plans } = tenant;
  const limit = usage.limit;
  const pct = limit === null ? 8 : Math.min(100, Math.round((usage.orders / limit) * 100));
  const upgrade = nextPlan(planInfo.id as TenantPlan);

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between">
        <Eyebrow>Tu plan</Eyebrow>
        <span className="tag border-violet-line bg-violet-soft text-violet-ink">
          <Zap className="h-3.5 w-3.5" />
          {planInfo.name}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-2">{planInfo.tagline}</p>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow">Ventas verificadas este mes</span>
          <span className="figure text-sm text-ink">
            {usage.orders}/{formatLimit(limit)}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-[2px] bg-line-2">
          <div
            className="h-full rounded-[2px] bg-violet transition-all"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-3">
          Tu plan incluye el registro de cada venta verificada del mes.
        </p>
      </div>

      {upgrade && (
        <div className="mt-5 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setShowUpgrade((v) => !v)}
            className="link text-sm"
          >
            {showUpgrade ? "Ocultar planes" : "Mejorar plan"}
          </button>
          {showUpgrade && (
            <div className="mt-3 space-y-2">
              {(["pro", "ultra"] as TenantPlan[])
                .filter((id) => id !== planInfo.id)
                .map((id) => {
                  const p = plans[id];
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between rounded-md border border-line bg-paper-2/60 px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink-3">
                          {formatLimit(p.monthlyOrderLimit)} órdenes/mes ·{" "}
                          {p.priceArs === 0
                            ? "Gratis"
                            : `$${p.priceArs.toLocaleString("es-AR")}/mes`}
                        </p>
                      </div>
                      <span className="text-xs text-ink-3">{p.tagline}</span>
                    </div>
                  );
                })}
              <p className="text-xs text-ink-3">
                Demo de hackathon — el cambio de plan todavía no procesa pagos.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
