import Link from "next/link";
import { IS_CONTRACT_CONFIGURED } from "@/lib/contract/config";
import { AlertTriangle } from "@/components/icons";

export function ConfigWarning() {
  if (IS_CONTRACT_CONFIGURED) return null;
  return (
    <div className="flex gap-3 rounded-md border border-amber-line bg-amber-soft p-4 text-sm text-amber-ink">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-medium">Todavía no hay servicio configurado</p>
        <p className="mt-0.5 text-amber-ink/85">
          Configurá <span className="figure">NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS</span>{" "}
          (o corré <span className="figure">npm run deploy</span>) para habilitar
          el registro de ventas. Podés probar el flujo con el{" "}
          <Link href="/simulador" className="link">
            simulador de orden
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
