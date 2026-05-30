import { BadgeCheck } from "@/components/icons";
import { Stamp } from "./Stamp";

export function VerifiedBadge({
  label = "Verificado por OrbiTrust",
  tone = "verified",
  animate = false,
  className = "",
}: {
  label?: string;
  tone?: "verified" | "violet" | "ink";
  animate?: boolean;
  className?: string;
}) {
  return (
    <Stamp tone={tone} animate={animate} className={className}>
      <BadgeCheck className="h-3.5 w-3.5" />
      {label}
    </Stamp>
  );
}
