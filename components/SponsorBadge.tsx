import { Zap } from "@/components/icons";

/** Badge cuando OrbiTrust cubrió el registro de la acción. */
export function SponsorBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`tag border-violet-line bg-violet-soft text-violet-ink ${className}`}
    >
      <Zap className="h-3.5 w-3.5" />
      Registro incluido en OrbiTrust
    </span>
  );
}
