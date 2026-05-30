"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth/client";
import { LoadingButton } from "@/components/LoadingButton";
import { ErrorAlert } from "@/components/ErrorAlert";

type Mode = "signin" | "signup";
type AuthFormSize = "default" | "presentation";

export function AuthForm({
  defaultMode = "signin",
  size = "default",
}: {
  defaultMode?: Mode;
  size?: AuthFormSize;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim().split("@")[0] || "Vendedor",
        });
        if (res.error) {
          setError(res.error.message || "No se pudo crear la cuenta.");
          return;
        }
      } else {
        const res = await signIn.email({
          email: email.trim(),
          password,
        });
        if (res.error) {
          setError(res.error.message || "Email o contraseña incorrectos.");
          return;
        }
      }
      const meRes = await fetch("/api/sellers/me", { cache: "no-store" });
      const me = (await meRes.json()) as { onboardingComplete?: boolean; ok?: boolean };
      const destination =
        mode === "signup" || !me.onboardingComplete ? "/onboarding" : "/dashboard";
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError((err as Error)?.message || "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  const isPresentation = size === "presentation";
  const labelClass = isPresentation ? "field-label-lg" : "field-label";
  const inputClass = isPresentation ? "input-lg" : "input";
  const formClass = isPresentation ? "space-y-6" : "space-y-4";
  const toggleClass = isPresentation
    ? "text-center text-base text-ink-3 sm:text-lg"
    : "text-center text-sm text-ink-3";
  const buttonClass = isPresentation ? "btn-lg w-full" : "w-full";

  return (
    <form onSubmit={handleSubmit} className={formClass}>
      {mode === "signup" && (
        <div>
          <label className={labelClass} htmlFor="name">
            Nombre
          </label>
          <input
            id="name"
            className={inputClass}
            placeholder="Ana"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className={inputClass}
          placeholder="ana@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          className={inputClass}
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </div>

      <LoadingButton type="submit" loading={busy} className={buttonClass}>
        {mode === "signup" ? "Crear cuenta" : "Ingresar"}
      </LoadingButton>

      <p className={toggleClass}>
        {mode === "signup" ? "¿Ya tenés cuenta?" : "¿Primera vez?"}{" "}
        <button
          type="button"
          className="link font-medium"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError(null);
          }}
        >
          {mode === "signup" ? "Ingresá" : "Creá tu cuenta"}
        </button>
      </p>

      <ErrorAlert title="No se pudo continuar" message={error} />
    </form>
  );
}
