/** Extracts a short, human-readable message from viem/wagmi errors. */
export function readableError(error: unknown): string {
  if (!error) return "";
  const e = error as {
    shortMessage?: string;
    details?: string;
    message?: string;
    reason?: string;
    cause?: { shortMessage?: string; message?: string; reason?: string };
  };

  if (e.cause?.shortMessage) return e.cause.shortMessage;
  if (e.shortMessage) return e.shortMessage;
  if (e.reason) return e.reason;
  if (e.details) return e.details;
  if (e.cause?.reason) return e.cause.reason;
  if (e.message) {
    const firstLine = e.message.split("\n")[0];
    return firstLine.length > 220 ? `${firstLine.slice(0, 220)}…` : firstLine;
  }
  return "Unexpected error";
}
