import ReactDOM from "react-dom/client";
import Widget from "./components/Widget";

import { init, useWallets, useConnectWallet } from "@web3-onboard/react";
import reactLogo from "./assets/back.svg";
import injectedModule from "@web3-onboard/injected-wallets";
import { ethers } from "ethers";
import { useEffect } from "react";

const injected = injectedModule();

// initialize Onboard
init({
  wallets: [injected],
  chains: [
    {
      id: "0x1",
      token: "ETH",
      label: "Ethereum Mainnet",
      rpcUrl: "https://ethereum.kyberengineering.io",
    },
    {
      id: "0x89",
      token: "MATIC",
      label: "Polygon",
      rpcUrl: "https://polygon.kyberengineering.io",
    },
  ],
});

const App = () => {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();

  // create an ethers provider
  let ethersProvider;

  if (wallet) {
    ethersProvider = new ethers.providers.Web3Provider(wallet.provider, "any");
  }

  const connectedWallets = useWallets();

  useEffect(() => {
    if (!connectedWallets.length) return;

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    );
    window.localStorage.setItem(
      "connectedWallets",
      JSON.stringify(connectedWalletsLabelArray)
    );
  }, [connectedWallets, wallet]);

  useEffect(() => {
    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem("connectedWallets") || "[]"
    );

    if (previouslyConnectedWallets?.length) {
      async function setWalletFromLocalStorage() {
        const walletConnected = await connect({
          autoSelect: previouslyConnectedWallets[0],
        });
      }
      setWalletFromLocalStorage();
    }
  }, [connect]);

  return (
    <div className="App">
      <Widget
        tokenList={[]}
        provider={ethersProvider}
        defaultTokenOut="0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
      />
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => (wallet ? disconnect(wallet) : connect())}>
          {!wallet ? "connect wallet" : "disconnect"}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
