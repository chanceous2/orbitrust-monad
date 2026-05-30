import type { ImageProps } from "next/image";
import Image from "next/image";

/** Imágenes de presentación: sin reescalado del optimizer de Next.js. */
export const presentationImageProps = {
  unoptimized: true,
  quality: 100,
} as const satisfies Partial<ImageProps>;

export function PresentationImage(props: ImageProps) {
  return <Image {...presentationImageProps} {...props} />;
}
