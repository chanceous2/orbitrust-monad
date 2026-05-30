export function TrustScoreCard({
  score,
  loading = false,
}: {
  score?: number | bigint;
  loading?: boolean;
}) {
  const value = score === undefined ? undefined : Number(score);
  const pct = value === undefined ? 0 : Math.min(100, Math.max(0, value));
  const litTicks = Math.round(pct / 10);

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Puntaje de confianza</p>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="figure text-6xl font-medium leading-none text-ink">
          {loading ? "—" : (value ?? 0)}
        </span>
        <span className="figure text-lg text-ink-3">/100</span>
      </div>

      <div className="mt-4 flex gap-1" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-[2px] ${
              i < litTicks ? "bg-violet" : "bg-line-2"
            }`}
          />
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-2">
        Sube con cada venta cerrada y cada reseña real de tus compradores.
      </p>
    </div>
  );
}
