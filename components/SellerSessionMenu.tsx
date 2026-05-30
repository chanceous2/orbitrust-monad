"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSession, signOut } from "@/lib/auth/client";
import { useMounted } from "@/lib/useMounted";
import { useSellerSession, type SellerStore } from "@/lib/sellers/useSellerSession";

const styles = {
  light: {
    skeleton: "bg-paper-2",
    trigger: "btn-secondary max-w-[12rem] truncate text-sm",
    menu: "rounded-md border border-line bg-surface py-1 shadow-lg",
    item: "flex w-full items-center px-3 py-2.5 text-left text-sm text-ink transition hover:bg-paper-2",
    itemActive: "bg-violet-soft font-medium text-violet-ink",
    itemMuted: "text-ink-3",
    footer: "border-t border-line px-3 py-2.5 text-sm text-violet-ink hover:underline",
    signOut: "btn-secondary text-sm",
  },
  dark: {
    skeleton: "bg-white/10",
    trigger:
      "inline-flex max-w-[12rem] items-center gap-1.5 truncate rounded-md border border-white/15 bg-black/80 px-3 py-2.5 text-sm text-white transition hover:bg-white/10",
    menu: "rounded-md border border-white/15 bg-[#0a0a0a] py-1 shadow-xl shadow-black/50",
    item: "flex w-full items-center px-3 py-2.5 text-left text-sm text-white/90 transition hover:bg-white/10",
    itemActive: "bg-white/10 font-medium text-white",
    itemMuted: "text-white/45",
    footer: "block border-t border-white/10 px-3 py-2.5 text-sm text-violet-soft hover:text-white",
    signOut:
      "rounded-md border border-white/15 bg-black/80 px-3 py-2.5 text-sm text-white transition hover:bg-white/10",
  },
} as const;

function sameAddress(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

function StoreSwitcher({
  variant,
  stores,
  activeAddress,
  label,
  switching,
  disabled,
  onSwitch,
}: {
  variant: keyof typeof styles;
  stores: SellerStore[];
  activeAddress: string;
  label: string;
  switching: boolean;
  disabled: boolean;
  onSwitch: (address: string) => Promise<void>;
}) {
  const theme = styles[variant];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; minWidth: number }>({
    top: 0,
    left: 0,
    minWidth: 0,
  });

  const updatePosition = useCallback(() => {
    const node = triggerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom + 6,
      left: rect.right,
      minWidth: Math.max(rect.width, 220),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const menu = document.getElementById("store-switcher-menu");
      if (menu?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  async function pickStore(address: string) {
    setOpen(false);
    await onSwitch(address);
  }

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <ul
            id="store-switcher-menu"
            role="listbox"
            aria-label="Tus tiendas"
            className={theme.menu}
            style={{
              position: "fixed",
              top: menuStyle.top,
              left: menuStyle.left,
              transform: "translateX(-100%)",
              minWidth: menuStyle.minWidth,
              zIndex: 9999,
            }}
          >
            {stores.map((store) => {
              const active = sameAddress(store.address, activeAddress);
              return (
                <li key={store.address} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={switching}
                    onClick={() => void pickStore(store.address)}
                    className={`${theme.item} ${active ? theme.itemActive : ""}`}
                  >
                    <span className="truncate">@{store.handle}</span>
                    {!store.registeredOnChain && (
                      <span className={`ml-2 shrink-0 text-xs ${theme.itemMuted}`}>
                        pendiente
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
            <li role="presentation">
              <Link
                href="/onboarding"
                className={theme.footer}
                onClick={() => setOpen(false)}
              >
                + Nueva tienda
              </Link>
            </li>
          </ul>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || switching}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`${theme.trigger} ${switching ? "opacity-60" : ""}`}
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0 text-[0.65rem] opacity-50" aria-hidden>
          ▾
        </span>
      </button>
      {menu}
    </>
  );
}

export function SellerSessionMenu({
  variant = "light",
}: {
  variant?: keyof typeof styles;
}) {
  const mounted = useMounted();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { profile, isLoading: profileLoading, refetch } = useSellerSession(
    Boolean(session?.user)
  );
  const [switching, setSwitching] = useState(false);
  const theme = styles[variant];

  if (!mounted || isPending) {
    return <div className={`h-10 w-28 animate-pulse rounded-md ${theme.skeleton}`} />;
  }

  if (!session?.user) {
    return (
      <Link href="/login" className="btn-primary">
        Entrar
      </Link>
    );
  }

  const stores = profile?.stores ?? [];
  const activeAddress = profile?.sellerAddress ?? "";
  const activeStore =
    stores.find((store) => sameAddress(store.address, activeAddress)) ?? stores[0];
  const label =
    activeStore != null
      ? `@${activeStore.handle}`
      : profile?.handle != null
        ? `@${profile.handle}`
        : profileLoading
          ? "…"
          : session.user.email;

  async function switchStore(address: string) {
    if (!address || sameAddress(address, activeAddress) || switching) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/sellers/active-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "No se pudo cambiar de tienda.");
      }
      await refetch({ silent: true });
      router.refresh();
    } catch {
      // Mantener la tienda activa si falla el cambio.
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {stores.length > 0 ? (
        <StoreSwitcher
          variant={variant}
          stores={stores}
          activeAddress={activeAddress}
          label={label}
          switching={switching}
          disabled={profileLoading}
          onSwitch={switchStore}
        />
      ) : (
        <Link href="/onboarding" className={theme.trigger}>
          Crear tienda
        </Link>
      )}

      <button type="button" className={theme.signOut} onClick={() => signOut()}>
        Salir
      </button>
    </div>
  );
}
