import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { SELLER_WALLET_SECRET } from "@/lib/server/env";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function encryptionKey(): Buffer {
  if (!SELLER_WALLET_SECRET) {
    throw new Error("SELLER_WALLET_SECRET is not configured");
  }
  return createHash("sha256").update(SELLER_WALLET_SECRET).digest();
}

function normalizePrivateKey(value: string): `0x${string}` {
  const trimmed = value.trim();
  const prefixed = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(prefixed)) {
    throw new Error("Invalid private key format");
  }
  return prefixed as `0x${string}`;
}

/** Encrypts a secp256k1 private key for at-rest storage. */
export function encryptPrivateKey(privateKey: `0x${string}`): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv);
  const keyHex = privateKey.slice(2);
  const encrypted = Buffer.concat([cipher.update(keyHex, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/** Decrypts a stored private key blob. */
export function decryptPrivateKey(blob: string): `0x${string}` {
  const buf = Buffer.from(blob, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("Invalid encrypted private key blob");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, encryptionKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return normalizePrivateKey(`0x${decrypted.toString("utf8")}`);
}
