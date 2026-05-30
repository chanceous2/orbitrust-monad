import Link from "next/link";
import { OrbiTrustLogo } from "@/components/OrbiTrustLogo";

export function SiteFooter() {
  return (
    <footer data-site-footer className="mt-auto border-t border-line">
      <div className="container-app flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <OrbiTrustLogo variant="dark" className="h-7 w-auto" />
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Cada venta y reseña verificada suma reputación portable para tu tienda,
            en cualquier canal donde vendas.
          </p>
        </div>
        <nav className="flex items-center gap-5 text-sm text-ink-2">
          <Link href="/" className="transition hover:text-ink">
            Inicio
          </Link>
          <Link href="/dashboard" className="transition hover:text-ink">
            Panel
          </Link>
          <Link href="/simulador" className="transition hover:text-ink">
            Simulador
          </Link>
          <a
            href="https://testnet.monadexplorer.com"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-ink"
          >
            Registro público
          </a>
        </nav>
      </div>
      <div className="container-app eyebrow pb-8">
        Demo · sin pagos reales · OrbiTrust
      </div>
    </footer>
  );
}
