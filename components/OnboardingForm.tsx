"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight } from "@/components/icons";
import { IS_CONTRACT_CONFIGURED } from "@/lib/contract/config";
import type { SellerStore } from "@/lib/sellers/useSellerSession";
import { LoadingButton } from "./LoadingButton";
import { ErrorAlert } from "./ErrorAlert";
import { TransactionResult } from "./TransactionResult";
import { Stamp } from "./Stamp";

export function OnboardingForm({
  onSuccess,
  onContinue,
  size = "default",
  embedded = false,
  unifiedAction = false,
  registeredStores = [],
  submitLabel = "Crear perfil de tienda",
}: {
  onSuccess?: () => void;
  onContinue?: () => void;
  size?: "default" | "presentation";
  embedded?: boolean;
  unifiedAction?: boolean;
  registeredStores?: SellerStore[];
  submitLabel?: string;
}) {
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const hasStores = registeredStores.length > 0;
  const trimmed = handle.trim();
  const willCreate = trimmed.length > 0;
  const willContinue = unifiedAction && !willCreate && hasStores;

  async function createStore() {
    setError(null);
    setHash(undefined);
    setBusy(true);
    try {
      const res = await fetch("/api/sellers/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: trimmed }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        hash?: `0x${string}`;
        alreadyRegistered?: boolean;
      };
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "No se pudo registrar.");
      }
      if (data.hash) setHash(data.hash);
      setHandle("");
      onSuccess?.();
    } catch (err) {
      setError((err as Error)?.message || "No se pudo registrar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!IS_CONTRACT_CONFIGURED) return;

    if (willCreate) {
      await createStore();
      return;
    }

    if (willContinue && onContinue) {
      onContinue();
    }
  }

  const isPresentation = size === "presentation";
  const labelClass = isPresentation ? "field-label-lg" : "field-label";
  const inputClass = isPresentation ? "input-lg" : "input";
  const hintClass = isPresentation
    ? "mt-2 text-sm text-ink-3 sm:text-base"
    : "mt-1.5 text-xs text-ink-3";
  const footnoteClass = isPresentation
    ? "text-center text-sm text-ink-3 sm:text-base"
    : "text-center text-xs text-ink-3";

  const buttonLabel = willCreate
    ? hasStores
      ? "Agregar tienda"
      : submitLabel
    : willContinue
      ? "Continuar"
      : submitLabel;

  const buttonDisabled =
    !IS_CONTRACT_CONFIGURED || (!willCreate && !willContinue);

  return (
    <form onSubmit={handleSubmit} className={isPresentation ? "space-y-5" : "space-y-4"}>
      <div>
        <label className={labelClass} htmlFor="handle">
          Nombre de tienda
        </label>
        <input
          id="handle"
          className={inputClass}
          placeholder="tiendadeana"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          maxLength={40}
          required={!unifiedAction}
        />
        {!embedded ? (
          <p className={hintClass}>
            Identificador público de tu tienda — por ej. el slug de Orbitienda o Shopify.
          </p>
        ) : null}
      </div>

      {unifiedAction && hasStores ? (
        <section aria-label="Tiendas registradas">
          <div className="rule-dashed mb-4" />
          <ul className="divide-y divide-line">
            {registeredStores.map((store) => (
              <li
                key={store.address}
                className="animate-fade-up flex items-baseline justify-between gap-4 py-4 first:pt-0"
              >
                <p className="font-display text-2xl text-ink sm:text-3xl">@{store.handle}</p>
                <Stamp tone="verified" className="shrink-0">
                  Registrada
                </Stamp>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <LoadingButton
        type="submit"
        loading={busy}
        disabled={buttonDisabled}
        className={isPresentation ? "btn-lg w-full sm:w-auto sm:min-w-[14rem]" : "w-full"}
      >
        {buttonLabel}
        {willContinue ? <ArrowRight className="h-5 w-5" aria-hidden /> : null}
      </LoadingButton>

      {!embedded ? (
        <>
          <p className={footnoteClass}>
            OrbiTrust activa tu perfil de tienda y cubre el registro de cada venta incluida
            en tu plan.
          </p>
          <TransactionResult hash={hash} confirmed={Boolean(hash)} sponsored />
        </>
      ) : null}

      <ErrorAlert title="No se pudo registrar" message={error} />
    </form>
  );
}
