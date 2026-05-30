type Tone = "verified" | "violet" | "ink";

const tones: Record<Tone, string> = {
  verified: "border-verified-line text-verified-ink",
  violet: "border-violet-line text-violet-ink",
  ink: "border-line-2 text-ink-2",
};

/** Ink-stamp / seal visual for verified records. */
export function Stamp({
  children,
  tone = "verified",
  animate = false,
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  animate?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`stamp ${tones[tone]} ${animate ? "animate-seal" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
