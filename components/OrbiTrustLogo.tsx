import Image from "next/image";

export const ORBITRUST_LOGO = {
  light: "https://public.orbitienda.com/test/orbitrust_light.png",
  dark: "https://public.orbitienda.com/test/orbitrust_dark_logo.png",
} as const;

const LOGO_DIMENSIONS = {
  light: { width: 1575, height: 466 },
  dark: { width: 1591, height: 464 },
} as const;

type OrbiTrustLogoProps = {
  variant?: keyof typeof ORBITRUST_LOGO;
  className?: string;
  priority?: boolean;
};

export function OrbiTrustLogo({
  variant = "dark",
  className = "h-8 w-auto",
  priority,
}: OrbiTrustLogoProps) {
  const dims = LOGO_DIMENSIONS[variant];

  return (
    <Image
      src={ORBITRUST_LOGO[variant]}
      alt="OrbiTrust"
      width={dims.width}
      height={dims.height}
      className={className}
      priority={priority}
    />
  );
}
