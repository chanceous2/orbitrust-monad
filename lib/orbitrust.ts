export enum OrderStatus {
  Created = 0,
  Accepted = 1,
  Fulfilled = 2,
  Completed = 3,
  Cancelled = 4,
}

export type SellerData = {
  owner: `0x${string}`;
  handle: string;
  metadataURI: string;
  completedSales: bigint;
  reviewsCount: bigint;
  ratingSum: bigint;
  exists: boolean;
};

export type OrderData = {
  id: bigint;
  seller: `0x${string}`;
  buyer: `0x${string}`;
  amount: bigint;
  metadataHash: string;
  status: number;
  reviewed: boolean;
  createdAt: bigint;
};

export const STATUS_LABELS: Record<number, string> = {
  0: "Creada",
  1: "Aceptada",
  2: "Enviada",
  3: "Completada",
  4: "Cancelada",
};

export const LIFECYCLE_STEPS = ["Creada", "Reseñada"] as const;

/**
 * Maps an order to its position in the lifecycle stepper.
 * Returns -1 when the order is cancelled.
 */
export function statusToStepIndex(status: number, reviewed: boolean): number {
  if (status === OrderStatus.Cancelled) return -1;
  if (reviewed) return 1;
  return 0;
}

/**
 * Turns a free-text description into a simple metadata hash string for V1.
 * We deliberately keep this as a readable string instead of IPFS for the demo.
 */
export function descriptionToMetadataHash(description: string): string {
  const clean = description.trim();
  if (!clean) return "demo:order";
  return `demo:${clean}`;
}

/** Reads back the human description from a `demo:` metadata hash. */
export function metadataHashToLabel(metadataHash: string): string {
  if (!metadataHash) return "Tu compra";
  const raw = metadataHash.startsWith("demo:") ? metadataHash.slice(5) : metadataHash;
  const nameMatch = raw.match(/^([^[\]:]+)/);
  if (nameMatch) return nameMatch[1].trim();
  return raw.trim().slice(0, 80);
}

/** Subtítulo legible (sin ids técnicos del simulador). */
export function metadataHashDetail(metadataHash: string): string | null {
  if (!metadataHash) return null;
  const raw = metadataHash.startsWith("demo:") ? metadataHash.slice(5) : metadataHash;
  const detailMatch = raw.match(/\[[^\]]+\]:\s*(.+)/);
  if (detailMatch) return detailMatch[1].trim();
  const parts = raw.split(": ");
  if (parts.length > 1) return parts.slice(1).join(": ").trim();
  return null;
}

/** Zero-padded ledger order number, e.g. `0007`. */
export function orderNo(id: bigint | number | string): string {
  return id.toString().padStart(4, "0");
}
