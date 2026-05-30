import "server-only";

import { listRegisteredSellers, type SellerWalletRecord } from "@/lib/sellers/store";
import {
  buildGenericProducts,
  displayNameFromHandle,
  getMerchantByHandle,
  inferPlatform,
  accentForHandle,
  platformLabel,
  productsForMerchant,
  storeMerchantId,
  type SimulatorMerchant,
  type SimulatorProduct,
} from "./catalog";

export type RealStoreMerchant = SimulatorMerchant & {
  platformLabel: string;
  sellerAddress: `0x${string}`;
  registeredOnChain: true;
  ready: true;
};

export type RealStoreCatalog = {
  merchants: RealStoreMerchant[];
  products: SimulatorProduct[];
};

function merchantFromWallet(wallet: SellerWalletRecord): RealStoreMerchant {
  const catalog = getMerchantByHandle(wallet.handle);

  if (catalog) {
    return {
      ...catalog,
      platformLabel: platformLabel(catalog.platform),
      sellerAddress: wallet.address,
      registeredOnChain: true,
      ready: true,
    };
  }

  const platform = inferPlatform(wallet.handle);
  return {
    id: storeMerchantId(wallet.address),
    handle: wallet.handle,
    name: displayNameFromHandle(wallet.handle),
    platform,
    tagline: "Tienda registrada en OrbiTrust",
    category: "Ecommerce",
    city: "Argentina",
    accent: accentForHandle(wallet.handle),
    platformLabel: platformLabel(platform),
    sellerAddress: wallet.address,
    registeredOnChain: true,
    ready: true,
  };
}

export async function listRealStoreMerchants(): Promise<RealStoreCatalog> {
  const wallets = await listRegisteredSellers();
  const merchants: RealStoreMerchant[] = wallets
    .filter((wallet) => wallet.registeredOnChain)
    .map((wallet) => merchantFromWallet(wallet));

  merchants.sort((a, b) => a.name.localeCompare(b.name, "es"));

  const products = merchants.flatMap((merchant) => {
    const catalogProducts = productsForMerchant(merchant.id);
    if (catalogProducts.length > 0) return catalogProducts;
    return buildGenericProducts(merchant.id, merchant.handle);
  });

  return { merchants, products };
}
