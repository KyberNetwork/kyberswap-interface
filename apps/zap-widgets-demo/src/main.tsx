import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import {
  getDefaultConfig,
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import {
  arbitrum,
  mainnet,
  polygon,
  bsc,
  base,
  optimism,
  zkSync,
  linea,
  scroll,
  avalanche,
} from "wagmi/chains";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createStorage } from "wagmi";

// Robinhood chain is absent from wagmi/chains, so it is defined locally.
const robinhood = defineChain({
  id: 4663,
  name: "Robinhood",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.chain.robinhood.com"],
      webSocket: ["wss://feed.mainnet.chain.robinhood.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 1,
    },
  },
});

const { wallets } = getDefaultWallets();
const wagmiConfig = getDefaultConfig({
  appName: "Liquidity Widgets",
  projectId: "d5fd1fd479f2a155c151efdf91c12c9e",
  wallets,
  chains: [
    mainnet,
    arbitrum,
    polygon,
    bsc,
    base,
    optimism,
    zkSync,
    linea,
    scroll,
    avalanche,
    robinhood,
  ],
  storage: createStorage({
    storage: localStorage,
  }),
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider theme={darkTheme()}>
        <App />
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

const createModalRoot = () => {
  let modalRoot = document.getElementById("ks-zap-demo-modal-root");
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "ks-zap-demo-modal-root";
    document.body.appendChild(modalRoot);
  }
};

createModalRoot();
