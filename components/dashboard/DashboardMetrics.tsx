import { Star } from "@/components/icons";

type Metric = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

function MetricCell({ label, value, icon }: Metric) {
  return (
    <div className="bg-surface px-5 py-6 sm:px-7 sm:py-7">
      <p className="eyebrow">{label}</p>
      <p className="figure mt-2 flex items-center gap-2 text-3xl text-ink sm:text-4xl">
        {icon}
        {value}
      </p>
    </div>
  );
}

export function DashboardMetrics({
  completedSales,
  reviewsCount,
  averageRating,
  trustScore,
}: {
  completedSales: number | bigint;
  reviewsCount: number | bigint;
  averageRating: string;
  trustScore: number | bigint;
}) {
  return (
    <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
      <MetricCell label="Ventas cerradas" value={String(completedSales)} />
      <MetricCell label="Reseñas" value={String(reviewsCount)} />
      <MetricCell
        label="Calificación"
        value={averageRating}
        icon={<Star className="h-5 w-5 text-amber" aria-hidden />}
      />
      <MetricCell label="Puntaje" value={String(trustScore)} />
    </div>
  );
}
