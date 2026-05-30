import type { Metadata } from "next";
import OnboardingClient from "./OnboardingClient";

export const metadata: Metadata = {
  title: "OrbiTrust — Configuración inicial",
  description: "Creá tu tienda y prepará OrbiTrust para registrar ventas verificadas.",
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
