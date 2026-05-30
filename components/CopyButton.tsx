"use client";

import { useState } from "react";
import { Copy, Check } from "@/components/icons";

export function CopyButton({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className={`inline-flex items-center text-ink-3 transition hover:text-ink ${className}`}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-verified-ink" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
