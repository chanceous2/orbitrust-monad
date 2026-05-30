import "server-only";

import { ObjectId } from "mongodb";
import { db } from "@/lib/mongo";

const USER_COLLECTION = "user";

export type UserOnboardingFields = {
  onboardingComplete: boolean;
  activeStoreAddress: string | null;
};

function userFilter(userId: string): { _id: ObjectId } {
  if (!ObjectId.isValid(userId)) {
    throw new Error(`User id inválido: ${userId}`);
  }
  return { _id: new ObjectId(userId) };
}

export async function getUserOnboardingFields(
  userId: string
): Promise<UserOnboardingFields> {
  const user = await db.collection(USER_COLLECTION).findOne(userFilter(userId), {
    projection: { onboardingComplete: 1, activeStoreAddress: 1 },
  });

  return {
    onboardingComplete: Boolean(user?.onboardingComplete),
    activeStoreAddress:
      typeof user?.activeStoreAddress === "string" ? user.activeStoreAddress : null,
  };
}

export async function setActiveStoreAddress(
  userId: string,
  address: `0x${string}`
): Promise<void> {
  const result = await db.collection(USER_COLLECTION).updateOne(userFilter(userId), {
    $set: { activeStoreAddress: address.toLowerCase(), updatedAt: new Date() },
  });

  if (result.matchedCount === 0) {
    throw new Error(`No se encontró el usuario ${userId}.`);
  }
}

export async function markUserOnboardingComplete(
  userId: string,
  activeStoreAddress?: `0x${string}`
): Promise<void> {
  const patch: Record<string, unknown> = {
    onboardingComplete: true,
    updatedAt: new Date(),
  };
  if (activeStoreAddress) {
    patch.activeStoreAddress = activeStoreAddress.toLowerCase();
  }

  const result = await db.collection(USER_COLLECTION).updateOne(
    userFilter(userId),
    { $set: patch }
  );

  if (result.matchedCount === 0) {
    throw new Error(`No se encontró el usuario ${userId}.`);
  }
}

/** Backfill: usuarios con tienda registrada pero sin flag en user. */
export async function syncOnboardingFromStores(
  userId: string,
  hasRegisteredStore: boolean
): Promise<UserOnboardingFields> {
  const current = await getUserOnboardingFields(userId);
  if (!current.onboardingComplete && hasRegisteredStore) {
    await markUserOnboardingComplete(userId, current.activeStoreAddress as `0x${string}` | undefined);
    return { ...current, onboardingComplete: true };
  }
  return current;
}
