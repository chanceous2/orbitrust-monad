"use client";

import { explorerTxUrl } from "@/lib/contract/config";
import { shortHash } from "@/lib/format";
import { Spinner, ArrowUpRight, CheckCircle } from "@/components/icons";
import { VerifiedBadge } from "./VerifiedBadge";
import { SponsorBadge } from "./SponsorBadge";
import { CopyButton } from "./CopyButton";

export function TransactionResult({
  hash,
  confirming,
  confirmed,
  sponsored = false,
}: {
  hash?: `0x${string}`;
  confirming?: boolean;
  confirmed?: boolean;
  sponsored?: boolean;
}) {
  if (!hash) return null;

  return (
    <div className="animate-fade-up rounded-md border border-line bg-paper-2/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          {confirmed ? (
            <CheckCircle className="h-5 w-5 text-verified-ink" />
          ) : (
            <Spinner className="h-5 w-5 text-violet-ink" />
          )}
          <span className="font-medium">
            {confirmed
              ? "Registro confirmado"
              : confirming
                ? "Confirmando registro…"
                : "Registro enviado"}
          </span>
        </div>
        {confirmed && <VerifiedBadge animate />}
      </div>

      {confirmed && sponsored && (
        <div className="mt-3">
          <SponsorBadge />
        </div>
      )}

      <div className="rule-dashed my-3" />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="eyebrow">Registro</span>
        <span className="figure text-ink-2">{shortHash(hash)}</span>
        <CopyButton value={hash} />
        <a
          href={explorerTxUrl(hash)}
          target="_blank"
          rel="noreferrer"
          className="link inline-flex items-center gap-1"
        >
          ver detalle <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
