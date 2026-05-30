/** Catálogo demo para hackathon — merchants + productos con foto y copy realistas. */

export type SimulatorPlatform = "orbitienda" | "shopify";

export type SimulatorMerchant = {
  id: string;
  handle: string;
  name: string;
  platform: SimulatorPlatform;
  tagline: string;
  category: string;
  city: string;
  accent: string;
};

export type SimulatorProduct = {
  id: string;
  merchantId: string;
  name: string;
  shortDescription: string;
  description: string;
  priceArs: number;
  category: string;
  imageUrl: string;
  imageAlt: string;
};

export const SIMULATOR_MERCHANTS: SimulatorMerchant[] = [
  {
    id: "moda-urbana-ba",
    handle: "modaurbanaba",
    name: "Moda Urbana BA",
    platform: "orbitienda",
    tagline: "Streetwear curado para Palermo y online.",
    category: "Indumentaria",
    city: "Buenos Aires",
    accent: "#6366f1",
  },
  {
    id: "casa-verde-home",
    handle: "casaverdehome",
    name: "Casa Verde Home",
    platform: "orbitienda",
    tagline: "Decoración consciente y piezas artesanales.",
    category: "Hogar",
    city: "Córdoba",
    accent: "#059669",
  },
  {
    id: "lumina-skincare",
    handle: "lumina_skincare",
    name: "Lumina Skincare",
    platform: "shopify",
    tagline: "Rutinas clean beauty con envíos a todo el país.",
    category: "Belleza",
    city: "Rosario",
    accent: "#db2777",
  },
  {
    id: "tecnolab-ar",
    handle: "tecnolab_ar",
    name: "Tecnolab AR",
    platform: "shopify",
    tagline: "Accesorios tech y audio para creators.",
    category: "Electrónica",
    city: "Buenos Aires",
    accent: "#0ea5e9",
  },
];

export const SIMULATOR_PRODUCTS: SimulatorProduct[] = [
  {
    id: "mu-remera-oversize",
    merchantId: "moda-urbana-ba",
    name: "Remera oversize negra",
    shortDescription: "Algodón peinado 240g, corte relaxed.",
    description:
      "Remera oversize de algodón peinado 240 g, costuras reforzadas y tinte reactivo. Ideal para looks urbanos. Talle M, hombre/unisex.",
    priceArs: 28900,
    category: "Remeras",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    imageAlt: "Remera negra oversize sobre fondo claro",
  },
  {
    id: "mu-campera-bomber",
    merchantId: "moda-urbana-ba",
    name: "Campera bomber oliva",
    shortDescription: "Interior polar, corte cropped.",
    description:
      "Bomber acolchada color oliva con cierre YKK, bolsillos laterales y puños ribeteados. Forro polar ligero para entretiempo.",
    priceArs: 74500,
    category: "Camperas",
    imageUrl:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
    imageAlt: "Campera bomber verde oliva",
  },
  {
    id: "cv-jarron-ceramica",
    merchantId: "casa-verde-home",
    name: "Jarrón cerámica arena",
    shortDescription: "Hecho a mano, serie limitada.",
    description:
      "Jarrón de cerámica esmaltada en tono arena, 28 cm de alto. Pieza artesanal con pequeñas variaciones naturales. Incluye base antideslizante.",
    priceArs: 42000,
    category: "Decoración",
    imageUrl:
      "https://images.unsplash.com/photo-1616486338812-3ada6104b0e0?w=800&q=80",
    imageAlt: "Jarrón de cerámica minimalista",
  },
  {
    id: "cv-lampara-mesa",
    merchantId: "casa-verde-home",
    name: "Lámpara de mesa lino",
    shortDescription: "Pantalla lino natural, luz cálida.",
    description:
      "Lámpara de mesa con base de roble claro y pantalla en lino crudo. Bombilla LED cálida incluida. Cable trenzado 1,8 m.",
    priceArs: 65800,
    category: "Iluminación",
    imageUrl:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
    imageAlt: "Lámpara de mesa con luz cálida",
  },
  {
    id: "ls-serum-vitamina-c",
    merchantId: "lumina-skincare",
    name: "Serum vitamina C 15%",
    shortDescription: "30 ml, textura gel acuosa.",
    description:
      "Serum con vitamina C estabilizada al 15%, niacinamida y ácido hialurónico. Unifica tono y aporta luminosidad. Uso AM, 30 ml.",
    priceArs: 38500,
    category: "Skincare",
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
    imageAlt: "Frasco de serum sobre mármol",
  },
  {
    id: "ls-balsamo-labial",
    merchantId: "lumina-skincare",
    name: "Bálsamo labial reparador",
    shortDescription: "Manteca de karité y vitamina E.",
    description:
      "Bálsamo reparador con manteca de karité, cera de abeja y vitamina E. Sin fragancia. Ideal post-exposición solar o clima seco.",
    priceArs: 8900,
    category: "Skincare",
    imageUrl:
      "https://images.unsplash.com/photo-1571781926291-c477b9d3f558?w=800&q=80",
    imageAlt: "Bálsamo labial en packaging minimal",
  },
  {
    id: "tl-audifonos-anc",
    merchantId: "tecnolab-ar",
    name: "Auriculares ANC Pro",
    shortDescription: "Cancelación activa, 32 h batería.",
    description:
      "Auriculares over-ear con cancelación activa híbrida, Bluetooth 5.3 y estuche rígido. Modo transparencia y micrófonos duales para calls.",
    priceArs: 189900,
    category: "Audio",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    imageAlt: "Auriculares negros sobre fondo amarillo",
  },
  {
    id: "tl-hub-usb-c",
    merchantId: "tecnolab-ar",
    name: "Hub USB-C 7 en 1",
    shortDescription: "HDMI 4K, SD y carga 100 W passthrough.",
    description:
      "Hub USB-C compacto en aluminio: HDMI 4K@60, 2× USB-A, USB-C data, lector SD/microSD y PD 100 W passthrough para Mac y ultrabooks.",
    priceArs: 54900,
    category: "Accesorios",
    imageUrl:
      "https://images.unsplash.com/photo-1625948515291-59832937e5a9?w=800&q=80",
    imageAlt: "Hub USB-C plateado conectado a laptop",
  },
];

export function getMerchant(id: string): SimulatorMerchant | undefined {
  return SIMULATOR_MERCHANTS.find((m) => m.id === id);
}

export function getMerchantByHandle(handle: string): SimulatorMerchant | undefined {
  const lower = handle.trim().toLowerCase();
  return SIMULATOR_MERCHANTS.find((m) => m.handle.toLowerCase() === lower);
}

export function catalogHandles(): string[] {
  return SIMULATOR_MERCHANTS.map((m) => m.handle);
}

export function getProduct(id: string): SimulatorProduct | undefined {
  return SIMULATOR_PRODUCTS.find((p) => p.id === id);
}

export function productsForMerchant(merchantId: string): SimulatorProduct[] {
  return SIMULATOR_PRODUCTS.filter((p) => p.merchantId === merchantId);
}

/** Metadata on-chain legible + id de producto para trazabilidad / AI futuro. */
export function productMetadataHash(product: SimulatorProduct): string {
  const summary = `${product.name}: ${product.shortDescription}`;
  const clean = summary.trim().slice(0, 120);
  return clean ? `demo:${clean}` : "demo:order";
}

export function platformLabel(platform: SimulatorPlatform): string {
  return platform === "orbitienda" ? "Orbitienda" : "Shopify";
}

const ACCENTS = ["#6366f1", "#059669", "#db2777", "#0ea5e9", "#b45309", "#7c3aed"];

const GENERIC_PRODUCT_TEMPLATES: Omit<SimulatorProduct, "id" | "merchantId">[] = [
  {
    name: "Más vendido",
    shortDescription: "El más vendido de la tienda.",
    description: "Producto destacado de la tienda — venta verificada vía integración.",
    priceArs: 32500,
    category: "Destacado",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    imageAlt: "",
  },
  {
    name: "Combo promo",
    shortDescription: "Pack con envío incluido.",
    description: "Combo promocional — ideal para demo de venta verificada.",
    priceArs: 48900,
    category: "Combo",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    imageAlt: "",
  },
  {
    name: "Nuevo ingreso",
    shortDescription: "Recién publicado en la tienda.",
    description: "Producto recién ingresado al catálogo del vendedor.",
    priceArs: 19900,
    category: "Novedad",
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    imageAlt: "",
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function storeMerchantId(address: `0x${string}`): string {
  return `store-${address.toLowerCase()}`;
}

export function displayNameFromHandle(handle: string): string {
  const cleaned = handle.replace(/[_-]+/g, " ").trim();
  if (!cleaned) return "Mi tienda";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function inferPlatform(handle: string): SimulatorPlatform {
  return hashString(handle.toLowerCase()) % 2 === 0 ? "orbitienda" : "shopify";
}

export function accentForHandle(handle: string): string {
  return ACCENTS[hashString(handle.toLowerCase()) % ACCENTS.length];
}

/** Productos demo para tiendas registradas que no están en el catálogo fijo. */
export function buildGenericProducts(merchantId: string, _handle: string): SimulatorProduct[] {
  return GENERIC_PRODUCT_TEMPLATES.map((template, index) => ({
    ...template,
    id: `${merchantId}-p${index}`,
    merchantId,
  }));
}

export function resolveSimulatorProduct(
  productId: string,
  merchantId: string,
  handle: string
): SimulatorProduct | undefined {
  const catalog = getProduct(productId);
  if (catalog && catalog.merchantId === merchantId) return catalog;

  return buildGenericProducts(merchantId, handle).find((p) => p.id === productId);
}
