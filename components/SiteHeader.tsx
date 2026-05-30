import Link from "next/link";
import { OrbiTrustLogo } from "@/components/OrbiTrustLogo";
import { SellerSessionMenu } from "./SellerSessionMenu";

export function SiteHeader() {
  return (
    <header data-site-header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <OrbiTrustLogo variant="dark" className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          <nav className="mr-1 hidden items-center gap-1 sm:flex">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-2 text-sm text-ink-2 transition hover:bg-paper-2 hover:text-ink"
            >
              Panel
            </Link>
            <Link
              href="/simulador"
              className="rounded-md px-3 py-2 text-sm text-ink-2 transition hover:bg-paper-2 hover:text-ink"
            >
              Simulador
            </Link>
          </nav>
          <SellerSessionMenu />
        </div>
      </div>
    </header>
  );
}
