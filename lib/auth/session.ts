import "server-only";

import { auth } from "@/lib/auth/auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  onboardingComplete: boolean;
  activeStoreAddress: string | null;
};

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  onboardingComplete?: boolean | null;
  activeStoreAddress?: string | null;
};

/** Returns the authenticated seller user or null. */
export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user as AuthUser | undefined;
  if (!user?.id || !user.email) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.email,
    onboardingComplete: Boolean(user.onboardingComplete),
    activeStoreAddress:
      typeof user.activeStoreAddress === "string" ? user.activeStoreAddress : null,
  };
}
