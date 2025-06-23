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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createStorage } from "wagmi";

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
