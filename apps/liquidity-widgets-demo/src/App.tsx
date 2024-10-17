import {
  PoolType,
  LiquidityWidget,
  ChainId,
} from "@kyberswap/liquidity-widgets";
import { useCallback, useEffect, useState } from "react";
import { init, useWallets, useConnectWallet } from "@web3-onboard/react";
import { ethers, providers } from "ethers";
import injectedModule from "@web3-onboard/injected-wallets";
import "@kyberswap/liquidity-widgets/dist/style.css";
import "./App.css";

const injected = injectedModule();

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
  const connectedWallets = useWallets();

  // create an ethers provider
  let ethersProvider: providers.Web3Provider | undefined;

  if (wallet) {
    ethersProvider = new ethers.providers.Web3Provider(wallet.provider, "any");
  }

  const [params, setParams] = useState<WidgetParams>({
    chainId: ChainId.Arbitrum,
    poolAddress: "0x641C00A822e8b671738d32a431a4Fb6074E5c79d",
    poolType: PoolType.DEX_UNISWAPV3,
  });
  const [key, setKey] = useState(Date.now());

  const handleUpdateParams = useCallback((params: WidgetParams) => {
    setParams(params);
    setKey(Date.now());
  }, []);

  const handleConnectWallet = () => {
    if (wallet) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("connectedWallets");
      }
      disconnect(wallet);
    } else connect();
  };

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

  return (
    <div className="ks-demo-app">
      <div className="ks-demo-header">
        <button className="ks-demo-btn" onClick={handleConnectWallet}>
          {!wallet ? "Connect wallet" : "Disconnect"}
        </button>
        <div>{wallet?.accounts?.[0].address}</div>
      </div>

      <div className="ks-demo-app-wrapper">
        <div className="ks-demo-params-wrapper">
          <Params params={params} setParams={handleUpdateParams} />
        </div>

        <LiquidityWidget
          key={key}
          provider={ethersProvider}
          onDismiss={() => {
            window.location.reload();
          }}
          source="zap-widget-demo"
          {...params}
          // initDepositTokens="0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
          // initAmounts="1"
        />
      </div>
    </div>
  );
}

export default App;

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
  const [localParams, setLocalParams] = useState(params);

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  return (
    <>
      <div className="ks-demo-params-container">
        <span>chainId</span>
        <input
          className="ks-demo-input"
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
          className="ks-demo-input"
          value={localParams.positionId}
          onChange={(e) => {
            setLocalParams((params) => ({
              ...params,
              positionId: e.target.value !== "" ? e.target.value : undefined,
            }));
          }}
        />

        <span>poolAddress</span>
        <input
          className="ks-demo-input"
          value={localParams.poolAddress}
          onChange={(e) => {
            setLocalParams((params) => ({
              ...params,
              poolAddress: e.target.value,
            }));
          }}
        />

        <span>PoolType</span>
        <div className="ks-demo-pool-type-container">
          {Object.keys(PoolType).map((key, index) => (
            <div className="ks-demo-pool-type-item" key={key}>
              <input
                className="ks-demo-input"
                type="radio"
                id={`${index + 1}`}
                name={PoolType[key as keyof typeof PoolType]}
                value={PoolType[key as keyof typeof PoolType]}
                checked={
                  localParams.poolType ===
                  PoolType[key as keyof typeof PoolType]
                }
                onChange={(e) =>
                  setLocalParams({
                    ...localParams,
                    poolType: e.currentTarget.value as PoolType,
                  })
                }
              />
              <label htmlFor={`${index + 1}`}>
                {PoolType[key as keyof typeof PoolType]}
              </label>
            </div>
          ))}
        </div>
      </div>

      <button className="ks-demo-btn" onClick={() => setParams(localParams)}>
        Save and Reload
      </button>
    </>
  );
}

// theme={{
//   text: "#ffffff",
//   subText: "#979797",
//   icons: "#a9a9a9",
//   layer1: "#1C1C1C",
//   dialog: "#1c1c1c",
//   layer2: "#313131",
//   stroke: "#313131",
//   chartRange: "#28e0b9",
//   chartArea: "#047855",
//   accent: "#31cb9e",
//   warning: "#ff9901",
//   error: "#ff537b",
//   success: "#189470",
//   fontFamily: "Work Sans",
//   borderRadius: "20px",
//   buttonRadius: "24px",
//   boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.04)",
// }}

{
  /* <div style={{ display: "flex", gap: "60px" }}>
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
</div>; */
}

{
  /* <span>initTickLower</span>
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
/> */
}
