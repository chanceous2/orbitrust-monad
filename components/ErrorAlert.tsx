"use client";

import { AlertTriangle } from "@/components/icons";

export function ErrorAlert({
  title = "Something went wrong",
  message,
}: {
  title?: string;
  message?: string | null;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-md border border-danger-line bg-danger-soft p-4 text-sm text-danger-ink"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 break-words text-danger-ink/85">{message}</p>
      </div>
    </div>
  );
}
