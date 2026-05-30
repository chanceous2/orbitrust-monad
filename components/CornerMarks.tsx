import { Plus } from "@/components/icons";

/** Print registration / crop marks at the corners of a sheet. */
export function CornerMarks({ className = "" }: { className?: string }) {
  const base = "pointer-events-none absolute h-2.5 w-2.5 text-line-2";
  return (
    <span aria-hidden className={className}>
      <Plus className={`${base} left-2 top-2`} />
      <Plus className={`${base} right-2 top-2`} />
      <Plus className={`${base} bottom-2 left-2`} />
      <Plus className={`${base} bottom-2 right-2`} />
    </span>
  );
}
