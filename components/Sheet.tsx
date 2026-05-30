import { CornerMarks } from "./CornerMarks";

/** A "ledger sheet" surface: paper card with optional registration marks. */
export function Sheet({
  children,
  marks = true,
  className = "",
}: {
  children: React.ReactNode;
  marks?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-lg border border-line bg-surface shadow-sm ${className}`}
    >
      {marks && <CornerMarks />}
      {children}
    </div>
  );
}
