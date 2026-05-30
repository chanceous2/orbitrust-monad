import Link from "next/link";
import { Eyebrow } from "@/components/Eyebrow";
import { AuthForm } from "@/components/auth/AuthForm";

type LoginPageProps = {
  searchParams?: { mode?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const defaultMode = searchParams?.mode === "signup" ? "signup" : "signin";
  const isSignup = defaultMode === "signup";

  return (
    <div className="page-centered">
      <div className="container-narrow w-full max-w-2xl">
        <Eyebrow className="eyebrow-lg">Panel del vendedor</Eyebrow>
        <h1 className="font-display mt-4 text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
          {isSignup ? "Creá tu cuenta" : "Iniciá sesión"}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-2 sm:text-xl">
          {isSignup
            ? "Registrate con email y contraseña. OrbiTrust crea tu perfil de tienda — no necesitás apps ni pagos extra."
            : "Ingresá con tu email y contraseña para ver tu reputación y ventas verificadas."}
        </p>

        <div className="card card-pad-lg mt-10">
          <AuthForm defaultMode={defaultMode} size="presentation" />
        </div>

        <p className="mt-8 text-center text-base text-ink-3 sm:text-lg">
          <Link href="/" className="link">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
