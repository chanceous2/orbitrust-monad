import Link from "next/link";
import { shortAddress } from "@/lib/format";
import { Star, ArrowRight } from "@/components/icons";
import { VerifiedBadge } from "./VerifiedBadge";
import { CopyButton } from "./CopyButton";

function Figure({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="sm:px-6 sm:first:pl-0">
      <p className="eyebrow">{label}</p>
      <p className="figure mt-1.5 flex items-center gap-1.5 text-2xl text-ink">
        {icon}
        {value}
      </p>
    </div>
  );
}

export function SellerStatsCard({
  handle,
  address,
  completedSales,
  reviewsCount,
  averageRating,
  trustScore,
  profileHref,
}: {
  handle: string;
  address?: string;
  completedSales: number | bigint;
  reviewsCount: number | bigint;
  averageRating: string;
  trustScore: number | bigint;
  profileHref?: string;
}) {
  return (
    <div className="card card-pad">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Vendedor</p>
          <h2 className="font-display mt-1.5 text-3xl text-ink">@{handle}</h2>
          {address && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-3">
              <span className="figure">{shortAddress(address)}</span>
              <CopyButton value={address} />
            </div>
          )}
        </div>
        <VerifiedBadge />
      </div>

      <div className="rule-dashed my-5" />

      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 sm:gap-x-0 sm:divide-x sm:divide-line">
        <Figure label="Completadas" value={String(completedSales)} />
        <Figure label="Reseñas" value={String(reviewsCount)} />
        <Figure
          label="Rating"
          value={averageRating}
          icon={<Star className="h-4 w-4 text-amber" />}
        />
        <Figure label="Puntaje" value={String(trustScore)} />
      </div>

      {profileHref && (
        <Link
          href={profileHref}
          className="link mt-5 inline-flex items-center gap-1.5 text-sm"
        >
          Ver perfil público <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
