import { http, createConfig } from "wagmi";
import { monadTestnet } from "viem/chains";
import { injected } from "wagmi/connectors";

const rpcUrl = process.env.NEXT_PUBLIC_MONAD_RPC_URL;

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected()],
  ssr: true,
  transports: {
    [monadTestnet.id]: http(rpcUrl && rpcUrl.length > 0 ? rpcUrl : undefined),
  },
});

export { monadTestnet };

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
