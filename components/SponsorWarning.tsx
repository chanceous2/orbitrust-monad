"use client";

import { useSponsorHealth } from "@/lib/hooks";
import { AlertTriangle } from "@/components/icons";

/**
 * Warns when the relayer is not configured server-side, so sponsored actions
 * (seller signing, buyer magic links) will fail until env vars are set.
 */
export function SponsorWarning() {
  const health = useSponsorHealth();
  if (!health || health.relayerConfigured) return null;

  return (
    <div className="flex gap-3 rounded-md border border-amber-line bg-amber-soft p-4 text-sm text-amber-ink">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-medium">Registro automático deshabilitado</p>
        <p className="mt-0.5 text-amber-ink/85">
          Configurá <span className="figure">RELAYER_PRIVATE_KEY</span> y{" "}
          <span className="figure">ORDER_TOKEN_SECRET</span> en el servidor para
          que OrbiTrust pueda registrar ventas y reseñas por vos.
        </p>
      </div>
    </div>
  );
}
