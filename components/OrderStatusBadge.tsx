import { OrderStatus, STATUS_LABELS } from "@/lib/orbitrust";

const map: Record<number, string> = {
  0: "border-slate-line bg-slate-soft text-ink-2", // Created
  1: "border-violet-line bg-violet-soft text-violet-ink", // Accepted
  2: "border-amber-line bg-amber-soft text-amber-ink", // Fulfilled
  3: "border-verified-line bg-verified-soft text-verified-ink", // Completed
  4: "border-line-2 bg-paper-2 text-ink-3", // Cancelled
};

export function OrderStatusBadge({
  status,
  reviewed = false,
}: {
  status: number;
  reviewed?: boolean;
}) {
  const isReviewed = status === OrderStatus.Completed && reviewed;
  const label = isReviewed ? "Reseñada" : (STATUS_LABELS[status] ?? "Desconocida");
  const cls = isReviewed
    ? "border-verified-line bg-verified-soft text-verified-ink"
    : (map[status] ?? map[4]);

  return (
    <span className={`tag ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-[1px] bg-current" />
      {label}
    </span>
  );
}
