import "./App.css";
import { useSwitchChain } from "wagmi";
import { Dex, ZapMigration, ChainId } from "@kyberswap/zap-migration-widgets";
import "@kyberswap/zap-migration-widgets/dist/style.css";
import "@rainbow-me/rainbowkit/styles.css";
import {
  ConnectButton,
  RainbowKitProvider,
  getDefaultConfig,
  getDefaultWallets,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import { arbitrum, mainnet, polygon, bsc, base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useAccount,
  useWalletClient,
  useChainId,
  WagmiProvider,
  createStorage,
} from "wagmi";
import { useState } from "react";

const { wallets } = getDefaultWallets();
const wagmiConfig = getDefaultConfig({
  appName: "Liquidity Widgets",
  projectId: "d5fd1fd479f2a155c151efdf91c12c9e",
  wallets,
  chains: [mainnet, arbitrum, polygon, bsc, base],
  storage: createStorage({
    storage: localStorage,
  }),
});

const queryClient = new QueryClient();

function Provider({ children }: React.PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function App() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();

  const [state, setState] = useState<{
    chainId: string;
    from: {
      dex: Dex;
      poolId: string;
      positionId: number | undefined;
    };
    to: {
      dex: Dex;
      poolId: string;
      positionId?: number;
    };
  }>({
    chainId: ChainId.Bsc.toString(),
    from: {
      dex: Dex.DEX_PANCAKESWAPV3,
      poolId: "0xBe141893E4c6AD9272e8C04BAB7E6a10604501a5",
      positionId: 1404415,
    },
    to: {
      dex: Dex.DEX_THENAFUSION,
      //poolId: "0xBe141893E4c6AD9272e8C04BAB7E6a10604501a5",
      poolId: "0x1123e75b71019962cd4d21b0f3018a6412edb63c",
      positionId: 16142,
    },
    //chainId: "56",
    //from: {
    //  dex: Dex.Pancakev3,
    //  poolId: "0xBe141893E4c6AD9272e8C04BAB7E6a10604501a5",
    //  positionId: 1404415,
    //},
    //to: {
    //  dex: Dex.Pancakev3,
    //  poolId: "0xf2688Fb5B81049DFB7703aDa5e770543770612C4",
    //},
    //chainId: "42161",
    //from: {
    //  dex: Dex.Uniswapv3,
    //  poolId: "0x2f5e87C9312fa29aed5c179E456625D79015299c",
    //  positionId: 4040452,
    //},
    //to: {
    //  dex: Dex.Uniswapv3,
    //  poolId: "0x641C00A822e8b671738d32a431a4Fb6074E5c79d",
    //  positionId: 3611201,
    //},
  });

  const [showMigration, setShowMigration] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        maxWidth: "960px",
        margin: "auto",
      }}
    >
      <ConnectButton />

      <div className="ks-demo-app">
        <div className="ks-demo-app-wrapper text-white">
          {!showMigration && (
            <>
              <div className="flex gap-4 w-[800px]">
                ChainId{" "}
                <input
                  className="border rounded bg-transparent border-stroke w-full px-4"
                  value={state.chainId}
                  onChange={(e) =>
                    setState((s) => ({ ...s, chainId: e.target.value }))
                  }
                />
              </div>
              <div className="flex w-[800px] gap-4">
                <div className="flex-1">
                  <div>Source</div>

                  <div className="flex flex-wrap gap-4">
                    {Object.entries(Dex)
                      .filter((x) => isNaN(+x[0]))
                      .map(([key, value]) => {
                        return (
                          <div className="flex" key={key}>
                            <input
                              type="radio"
                              id={`from-${key}`}
                              name={key}
                              value={value as string}
                              checked={state.from.dex == value}
                              onChange={() => {
                                setState((s) => ({
                                  ...s,
                                  from: { ...s.from, dex: value as any },
                                }));
                              }}
                            />
                            <label htmlFor={`from-${key}`}>{key}</label>
                          </div>
                        );
                      })}
                  </div>

                  <div className="flex gap-2 mt-2">
                    Pool:{" "}
                    <input
                      className="border rounded bg-transparent border-stroke w-full"
                      value={state.from.poolId}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          from: { ...s.from, poolId: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="flex gap-2 mt-2">
                    positionId:{" "}
                    <input
                      className="border rounded bg-transparent border-stroke w-full"
                      value={state.from.positionId}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          from: { ...s.from, positionId: +e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div>Target</div>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(Dex)
                      .filter((x) => isNaN(+x[0]))
                      .map(([key, value]) => {
                        return (
                          <div className="flex" key={key}>
                            <input
                              type="radio"
                              id={"to-" + key}
                              name={key}
                              value={value as string}
                              checked={state.to.dex === value}
                              onChange={() => {
                                console.log(key, value);
                                setState((s) => ({
                                  ...s,
                                  to: { ...s.to, dex: value as any },
                                }));
                              }}
                            />
                            <label htmlFor={`to-${key}`}>{key}</label>
                          </div>
                        );
                      })}
                  </div>

                  <div className="flex gap-2 mt-2">
                    Pool:{" "}
                    <input
                      className="border rounded bg-transparent border-stroke w-full"
                      value={state.to.poolId}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          to: { ...s.to, poolId: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <button
                className="bg-primary px-6  py-2 rounded-xl"
                onClick={() => {
                  if (
                    !state.from.poolId ||
                    !state.to.poolId ||
                    !state.from.positionId
                  ) {
                    alert("Please fill in all fields");
                    return;
                  }

                  setShowMigration(true);
                }}
              >
                Migrate
              </button>
            </>
          )}

          {showMigration && (
            <ZapMigration
              onClose={() => {
                setShowMigration(false);
              }}
              chainId={+state.chainId}
              from={{
                dex: state.from.dex,
                poolId: state.from.poolId,
                positionId: +(state.from.positionId || -1), // never can be undefined
              }}
              to={{
                dex: state.to.dex,
                poolId: state.to.poolId,
                positionId: state.to.positionId,
                //dex: Dex.Uniswapv3,
                //poolId: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
              }}
              client="zap-migration-demo"
              connectedAccount={{
                address,
                chainId,
              }}
              onConnectWallet={() => {
                openConnectModal?.();
              }}
              onSwitchChain={() => {
                switchChain?.({ chainId: ChainId.Bsc });
              }}
              onSubmitTx={async (txData: {
                from: string;
                to: string;
                value: string;
                data: string;
              }) => {
                if (!walletClient) throw new Error("No wallet client");
                try {
                  const hash = await walletClient?.sendTransaction({
                    account: txData.from as `0x${string}`,
                    to: txData.to as `0x${string}`,
                    data: txData.data as `0x${string}`,
                    value: BigInt(txData.value),
                  });
                  return hash;
                } catch (e) {
                  console.log(e);
                  throw e;
                }
              }}
              initialTick={{
                tickLower: -100,
                tickUpper: 20,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const AppWithProvider = () => {
  return (
    <Provider>
      <App />
    </Provider>
  );
};

export default AppWithProvider;
