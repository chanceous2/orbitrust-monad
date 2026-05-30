import "server-only";

import { MongoClient, type Db } from "mongodb";
import { MONGODB_URI } from "@/lib/server/env";

declare global {
  // eslint-disable-next-line no-var
  var _orbitrustMongoClient: MongoClient | undefined;
}

function createClient(): MongoClient {
  return new MongoClient(MONGODB_URI);
}

/** Shared MongoClient (preserved across HMR in dev). */
export const mongoClient: MongoClient =
  global._orbitrustMongoClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  global._orbitrustMongoClient = mongoClient;
}

/** Default database from MONGODB_URI path (e.g. orbitrust). */
export const db: Db = mongoClient.db();

let connectPromise: Promise<void> | null = null;

/** Ensures the shared client is connected (required on cold serverless starts). */
export async function ensureMongoConnected(): Promise<void> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }
  if (!connectPromise) {
    connectPromise = mongoClient.connect().then(() => undefined);
  }
  await connectPromise;
}
