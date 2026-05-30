import "server-only";

import { betterAuth } from "better-auth/minimal";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "@/lib/mongo";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from "@/lib/server/env";

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      onboardingComplete: {
        type: "boolean",
        required: false,
        defaultValue: false,
        fieldName: "onboardingComplete",
      },
      activeStoreAddress: {
        type: "string",
        required: false,
        fieldName: "activeStoreAddress",
      },
    },
  },
});
