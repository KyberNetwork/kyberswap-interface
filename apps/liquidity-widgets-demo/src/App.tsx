import {
  PoolType,
  LiquidityWidget,
  ChainId,
} from "@kyberswap/liquidity-widgets";
import { useCallback, useEffect, useState } from "react";

import { init, useWallets, useConnectWallet } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import { ethers, providers } from "ethers";
import "@kyberswap/liquidity-widgets/dist/style.css";
import "./App.css";

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
      id: "0x38",
      token: "BNB",
      label: "BSC",
      rpcUrl: "https://bsc.kyberengineering.io",
    },
    {
      id: "0x89",
      token: "POL",
      label: "Polygon",
      rpcUrl: "https://polygon.kyberengineering.io",
    },
    {
      id: "0xc7",
      token: "BTT",
      label: "BTTC",
      rpcUrl: "https://bttc.kyberengineering.io",
    },
    {
      id: "0x2105",
      token: "ETH",
      label: "Base",
      rpcUrl: "https://base.llamarpc.com",
    },

    {
      id: "0xe708",
      token: "ETH",
      label: "Linea",
      rpcUrl: "https://rpc.linea.build",
    },
  ],
});

function App() {
  const [{ wallet }, connect, disconnect] = useConnectWallet();

  // create an ethers provider
  let ethersProvider: providers.Web3Provider | undefined;

  if (wallet) {
    ethersProvider = new ethers.providers.Web3Provider(wallet.provider, "any");
  }

  const connectedWallets = useWallets();

  useEffect(() => {
    if (!connectedWallets.length) return;

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    );
    if (typeof window !== "undefined")
      window.localStorage.setItem(
        "connectedWallets",
        JSON.stringify(connectedWalletsLabelArray)
      );
  }, [connectedWallets, wallet]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem("connectedWallets") || "[]"
    );

    if (previouslyConnectedWallets?.length) {
      const setWalletFromLocalStorage = async () => {
        await connect({
          autoSelect: previouslyConnectedWallets[0],
        });
      };
      setWalletFromLocalStorage();
    }
  }, [connect]);

  const [params, setParams] = useState<WidgetParams>({
    chainId: ChainId.Linea,
    // positionId: "1288027",
    poolAddress: "0xa99cd4e87b9acac403540f90db07c9507540f965",
    poolType: PoolType.DEX_METAVAULTV3,
  });
  const [key, setKey] = useState(Date.now());
  const handleUpdateParams = useCallback((params: WidgetParams) => {
    setParams(params);
    setKey(Date.now());
  }, []);

  return (
    <div style={{ margin: "auto", width: "100%", maxWidth: "960px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div>{wallet?.accounts?.[0].address}</div>
        <button onClick={() => (wallet ? disconnect(wallet) : connect())}>
          {!wallet ? "connect wallet" : "disconnect"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          marginTop: "1rem",
        }}
      >
        <Params params={params} setParams={handleUpdateParams} />
      </div>

      <LiquidityWidget
        key={key}
        provider={ethersProvider}
        theme={{
          text: "#ffffff",
          subText: "#979797",
          icons: "#a9a9a9",
          layer1: "#1C1C1C",
          dialog: "#1c1c1c",
          layer2: "#313131",
          stroke: "#313131",
          chartRange: "#28e0b9",
          chartArea: "#047855",
          accent: "#31cb9e",
          warning: "#ff9901",
          error: "#ff537b",
          success: "#189470",
          fontFamily: "Work Sans",
          borderRadius: "20px",
          buttonRadius: "24px",
          boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.04)",
        }}
        onDismiss={() => {
          window.location.reload();
        }}
        source="zap-widget-demo"
        {...params}
      />
    </div>
  );
}

export default App;

// chainId={137}
// poolAddress="0xB6e57ed85c4c9dbfEF2a68711e9d6f36c56e0FcB"
// poolType={PoolType.DEX_UNISWAPV3}

// chainId={42161}
// positionId="24654"
// poolType={PoolType.DEX_PANCAKESWAPV3}
// poolAddress="0x0bacc7a9717e70ea0da5ac075889bd87d4c81197"

type WidgetParams = {
  chainId: number;
  positionId?: string;
  poolAddress: string;
  poolType: PoolType;
  //theme: "light" | "dark";
  //initTickUpper?: string;
  //initTickLower?: string;
};

function Params({
  params,
  setParams,
}: {
  params: WidgetParams;
  setParams: (p: WidgetParams) => void;
}) {
  // const [showParams, setShowParams] = useState(false);
  const [localParams, setLocalParams] = useState(params);

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px 400px",
            gap: "8px",
          }}
        >
          <span>chainId</span>
          <input
            value={String(localParams.chainId)}
            onChange={(e) => {
              setLocalParams((params) => ({
                ...params,
                chainId: Number(e.target.value),
              }));
            }}
          />

          <span>positionId</span>
          <input
            value={localParams.positionId}
            onChange={(e) => {
              setLocalParams((params) => ({
                ...params,
                positionId: e.target.value,
              }));
            }}
          />

          {/*
          <span>initTickLower</span>
          <input
            value={localParams.initTickLower}
            onChange={(e) => {
              setLocalParams((params) => ({
                ...params,
                initTickLower: e.target.value,
              }));
            }}
          />

          <span>initTickUpper</span>
          <input
            value={localParams.initTickUpper}
            onChange={(e) => {
              setLocalParams((params) => ({
                ...params,
                initTickUpper: e.target.value,
              }));
            }}
          />
*/}

          <span>poolAddress</span>
          <input
            value={localParams.poolAddress}
            onChange={(e) => {
              setLocalParams((params) => ({
                ...params,
                poolAddress: e.target.value,
              }));
            }}
          />
        </div>

        {/*
        <div style={{ display: "flex", gap: "60px" }}>
          <span>Theme</span>
          <div>
            <input
              type="radio"
              id="dark"
              name="Dark"
              value="dark"
              checked={localParams.theme === "dark"}
              onChange={(e) =>
                setLocalParams({
                  ...localParams,
                  theme: e.currentTarget.value as "light" | "dark",
                })
              }
            />
            <label htmlFor="dark">Dark</label>

            <input
              type="radio"
              id="light"
              name="Light"
              value="light"
              checked={localParams.theme === "light"}
              onChange={(e) =>
                setLocalParams({
                  ...localParams,
                  theme: e.currentTarget.value as "light" | "dark",
                })
              }
            />
            <label htmlFor="light">light</label>
          </div>
        </div>
        */}

        <div style={{ display: "flex", gap: "60px" }}>
          <span>PoolType</span>
          <div>
            <input
              type="radio"
              id="1"
              name={PoolType.DEX_METAVAULTV3}
              value={PoolType.DEX_METAVAULTV3}
              checked={localParams.poolType === PoolType.DEX_METAVAULTV3}
              onChange={(e) =>
                setLocalParams({
                  ...localParams,
                  poolType: e.currentTarget.value as PoolType,
                })
              }
            />
            <label htmlFor="1">{PoolType.DEX_METAVAULTV3}</label>

            <input
              type="radio"
              id="2"
              name={PoolType.DEX_UNISWAPV3}
              value={PoolType.DEX_UNISWAPV3}
              checked={localParams.poolType === PoolType.DEX_UNISWAPV3}
              onChange={(e) =>
                setLocalParams({
                  ...localParams,
                  poolType: e.currentTarget.value as PoolType,
                })
              }
            />
            <label htmlFor="2">{PoolType.DEX_UNISWAPV3}</label>

            <input
              type="radio"
              id="3"
              name={PoolType.DEX_PANCAKESWAPV3}
              value={PoolType.DEX_PANCAKESWAPV3}
              checked={localParams.poolType === PoolType.DEX_PANCAKESWAPV3}
              onChange={(e) =>
                setLocalParams({
                  ...localParams,
                  poolType: e.currentTarget.value as PoolType,
                })
              }
            />
            <label htmlFor="3">{PoolType.DEX_PANCAKESWAPV3}</label>
          </div>
        </div>
        <button
          style={{
            width: "max-content",
          }}
          onClick={() => setParams(localParams)}
        >
          Save and Reload
        </button>
      </div>
    </>
  );
}

//theme={{
//  text: "#FFFFFF",
//  subText: "#B6AECF",
//  icons: "#a9a9a9",
//  layer1: "#27262C",
//  dialog: "#27262C",
//  layer2: "#363046",
//  stroke: "#363046",
//  chartRange: "#5DC5D2",
//  chartArea: "#457F89",
//  accent: "#5DC5D2",
//  warning: "#F4B452",
//  error: "#FF5353",
//  success: "#189470",
//  fontFamily: "Kanit, Sans-serif",
//  borderRadius: "20px",
//  buttonRadius: "16px",
//  boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.04)",
//}}
//
