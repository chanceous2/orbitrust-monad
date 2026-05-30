import Link from "next/link";
import { OrbiTrustLogo } from "@/components/OrbiTrustLogo";
import { SellerSessionMenu } from "@/components/SellerSessionMenu";

export function LandingHeroNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 overflow-visible border-b border-white/10 bg-black/90">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <OrbiTrustLogo variant="light" className="h-8 w-auto" priority />
        </Link>

        <div className="flex items-center gap-2">
          <nav className="mr-1 hidden items-center gap-1 sm:flex">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-2 text-sm text-white/65 transition hover:bg-white/10 hover:text-white"
            >
              Panel
            </Link>
            <Link
              href="/simulador"
              className="rounded-md px-3 py-2 text-sm text-white/65 transition hover:bg-white/10 hover:text-white"
            >
              Simulador
            </Link>
          </nav>
          <SellerSessionMenu variant="dark" />
        </div>
      </div>
    </header>
  );
}
