import type { Metadata } from "next";
import SimuladorPage from "./SimuladorClient";

export const metadata: Metadata = {
  title: "OrbiTrust — Simulador de webhook",
  description:
    "Simulá el webhook de Orbitienda o Shopify que registra una venta en OrbiTrust.",
};

export default function Page() {
  return <SimuladorPage />;
}
