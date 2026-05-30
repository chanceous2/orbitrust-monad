"use client";

import { useEffect, useState } from "react";

/** Avoids hydration mismatches for wallet/account-dependent UI. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
