import { cookieStorage, createStorage } from "wagmi";
import { getDefaultConfig, Chain } from "@rainbow-me/rainbowkit";
import { mainnet } from "wagmi/chains";

export const projectId = "2455679236dbec241fec394feb4fe62d";

// Local avax custom chain

// Create wagmiConfig
export const config = getDefaultConfig({
  appName: "App",
  chains: [mainnet],
  ssr: true,
  projectId,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
