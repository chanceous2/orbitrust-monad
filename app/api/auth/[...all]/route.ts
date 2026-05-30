import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";

const handler = toNextJsHandler(auth);

export const { GET, POST, PATCH, PUT, DELETE } = handler;
