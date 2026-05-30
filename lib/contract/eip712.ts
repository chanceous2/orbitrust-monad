import { MONAD_TESTNET_CHAIN_ID } from "./config";

/**
 * Shared EIP-712 definitions for OrbiTrust sponsored meta-transactions.
 *
 * This is the SINGLE SOURCE OF TRUTH for the typed data used by:
 *  - the seller's browser wallet (wagmi `signTypedData`)
 *  - the OrbiTrust relayer / API (viem `signTypedData` + `recoverTypedDataAddress`)
 *  - the Hardhat tests
 *
 * It MUST stay in sync with the type hashes declared in
 * `contracts/OrbiTrustRegistry.sol`.
 */

export const EIP712_DOMAIN_NAME = "OrbiTrust";
export const EIP712_DOMAIN_VERSION = "1";

export type OrbiTrustDomain = {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: `0x${string}`;
};

export function getOrbiTrustDomain(
  verifyingContract: `0x${string}`,
  chainId: number = MONAD_TESTNET_CHAIN_ID
): OrbiTrustDomain {
  return {
    name: EIP712_DOMAIN_NAME,
    version: EIP712_DOMAIN_VERSION,
    chainId,
    verifyingContract,
  };
}

/** EIP-712 type definitions, keyed by primary type. */
export const ORBITRUST_TYPES = {
  RegisterSeller: [
    { name: "handle", type: "string" },
    { name: "metadataURI", type: "string" },
    { name: "nonce", type: "uint256" },
  ],
  CreateOrder: [
    { name: "buyer", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "metadataHash", type: "string" },
    { name: "nonce", type: "uint256" },
  ],
  AcceptOrder: [
    { name: "orderId", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
  MarkFulfilled: [
    { name: "orderId", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
  ConfirmReceived: [
    { name: "orderId", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
  CancelOrder: [
    { name: "orderId", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
  LeaveReview: [
    { name: "orderId", type: "uint256" },
    { name: "rating", type: "uint8" },
    { name: "reviewHash", type: "string" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export type SponsoredActionId =
  | "registerSeller"
  | "createOrder"
  | "acceptOrder"
  | "markFulfilled"
  | "confirmReceived"
  | "cancelOrder"
  | "leaveReview";

/** JSON-safe payloads sent over the wire (bigints encoded as strings). */
export type SponsoredPayloads = {
  registerSeller: { handle: string; metadataURI: string };
  createOrder: {
    buyer: `0x${string}`;
    amount: string;
    metadataHash: string;
  };
  acceptOrder: { orderId: string };
  markFulfilled: { orderId: string };
  confirmReceived: { orderId: string };
  cancelOrder: { orderId: string };
  leaveReview: { orderId: string; rating: number; reviewHash: string };
};

/** Union of every action payload (handy for non-generic server code). */
export type AnySponsoredPayload = SponsoredPayloads[SponsoredActionId];

type ActionMeta = {
  primaryType: keyof typeof ORBITRUST_TYPES;
  functionName: string;
  /** Actor whose signature/nonce authorises the action. */
  actor: "seller" | "buyer";
};

export const SPONSORED_ACTIONS: Record<SponsoredActionId, ActionMeta> = {
  registerSeller: {
    primaryType: "RegisterSeller",
    functionName: "registerSellerWithSignature",
    actor: "seller",
  },
  createOrder: {
    primaryType: "CreateOrder",
    functionName: "createOrderWithSignature",
    actor: "seller",
  },
  acceptOrder: {
    primaryType: "AcceptOrder",
    functionName: "acceptOrderWithSignature",
    actor: "buyer",
  },
  markFulfilled: {
    primaryType: "MarkFulfilled",
    functionName: "markFulfilledWithSignature",
    actor: "seller",
  },
  confirmReceived: {
    primaryType: "ConfirmReceived",
    functionName: "confirmReceivedWithSignature",
    actor: "buyer",
  },
  cancelOrder: {
    primaryType: "CancelOrder",
    functionName: "cancelOrderWithSignature",
    actor: "seller",
  },
  leaveReview: {
    primaryType: "LeaveReview",
    functionName: "leaveReviewWithSignature",
    actor: "buyer",
  },
};

/**
 * Builds the typed-data message (with bigint fields) for a given action.
 * The shape matches the contract's `abi.encode(...)` ordering exactly.
 */
export function buildTypedDataMessage<A extends SponsoredActionId>(
  action: A,
  payload: SponsoredPayloads[A],
  nonce: bigint
): Record<string, unknown> {
  switch (action) {
    case "registerSeller": {
      const p = payload as SponsoredPayloads["registerSeller"];
      return { handle: p.handle, metadataURI: p.metadataURI, nonce };
    }
    case "createOrder": {
      const p = payload as SponsoredPayloads["createOrder"];
      return {
        buyer: p.buyer,
        amount: BigInt(p.amount),
        metadataHash: p.metadataHash,
        nonce,
      };
    }
    case "leaveReview": {
      const p = payload as SponsoredPayloads["leaveReview"];
      return {
        orderId: BigInt(p.orderId),
        rating: p.rating,
        reviewHash: p.reviewHash,
        nonce,
      };
    }
    default: {
      const p = payload as { orderId: string };
      return { orderId: BigInt(p.orderId), nonce };
    }
  }
}

/** Ordered contract-call arguments for the matching `*WithSignature` function. */
export function buildContractArgs<A extends SponsoredActionId>(
  action: A,
  payload: SponsoredPayloads[A],
  nonce: bigint,
  signature: `0x${string}`
): readonly unknown[] {
  switch (action) {
    case "registerSeller": {
      const p = payload as SponsoredPayloads["registerSeller"];
      return [p.handle, p.metadataURI, nonce, signature];
    }
    case "createOrder": {
      const p = payload as SponsoredPayloads["createOrder"];
      return [p.buyer, BigInt(p.amount), p.metadataHash, nonce, signature];
    }
    case "leaveReview": {
      const p = payload as SponsoredPayloads["leaveReview"];
      return [BigInt(p.orderId), p.rating, p.reviewHash, nonce, signature];
    }
    default: {
      const p = payload as { orderId: string };
      return [BigInt(p.orderId), nonce, signature];
    }
  }
}

/** Convenience bundle for viem/wagmi `signTypedData`. */
export function buildSignTypedDataArgs<A extends SponsoredActionId>(
  action: A,
  payload: SponsoredPayloads[A],
  nonce: bigint,
  verifyingContract: `0x${string}`,
  chainId?: number
) {
  const primaryType = SPONSORED_ACTIONS[action].primaryType;
  return {
    domain: getOrbiTrustDomain(verifyingContract, chainId),
    types: { [primaryType]: ORBITRUST_TYPES[primaryType] },
    primaryType,
    message: buildTypedDataMessage(action, payload, nonce),
  } as const;
}
