import { Theme, defaultTheme } from "@/theme";
import {
  MAX_TICK,
  MIN_TICK,
  decodePosition,
  getPositionAmounts,
  nearestUsableTick,
} from "@kyber/utils/uniswapv3";
import { getFunctionSelector, encodeUint256 } from "@kyber/utils/crypto";
import { createContext, useRef, useContext, useEffect } from "react";
import {
  ChainId,
  PoolType,
  Pool,
  Position,
  poolResponse,
  univ3Pool,
  univ2Pool,
  univ3PoolType,
  univ2PoolType,
  Token,
} from "@/schema";
import { createStore, useStore } from "zustand";
import { DexInfos, NetworkInfo, PATHS } from "@/constants";
import { useTokenPrices } from "@kyber/hooks/use-token-prices";

export interface WidgetProps {
  theme?: Theme;

  // Pool and Accouunt Info
  poolAddress: string;
  positionId?: string;
  poolType: PoolType;
  chainId: ChainId;
  connectedAccount: {
    address?: string | undefined; // check if account is connected
    chainId: number; // check if wrong network
  };

  // Widget Actions
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onOpenZapMigration?: (position: {
    exchange: string;
    poolId: string;
    positionId: string | number;
  }) => void;
  onSubmitTx: (txData: {
    from: string;
    to: string;
    value: string;
    data: string;
    gasLimit: string;
  }) => Promise<string>;

  initDepositTokens?: string;
  initAmounts?: string;

  source: string; // for tracking volume

  aggregatorOptions?: {
    includedSources?: string[];
    excludedSources?: string[];
  };
  feeConfig?: {
    feePcm: number;
    feeAddress: string;
  };

  onViewPosition?: () => void;
}

interface WidgetState extends WidgetProps {
  theme: Theme;
  pool: "loading" | Pool;
  position: "loading" | Position;
  errorMsg: string;
  showWidget: boolean;
  poolLoading: boolean;

  getPool: (
    fetchPrices: (
      address: string[]
    ) => Promise<{ [key: string]: { PriceBuy: number } }>
  ) => void;

  setConnectedAccount: (
    connectedAccount: WidgetProps["connectedAccount"]
  ) => void;

  toggleShowWidget: (newState: boolean) => void;
}

type WidgetProviderProps = React.PropsWithChildren<WidgetProps>;

const createWidgetStore = (initProps: WidgetProps) => {
  return createStore<WidgetState>()((set, get) => ({
    ...initProps,
    theme: initProps.theme || defaultTheme,
    pool: "loading",
    position: "loading",
    errorMsg: "",
    showWidget: true,
    poolLoading: false,

    getPool: async (fetchPrices) => {
      const { poolAddress, chainId, poolType, positionId } = get();

      set({ poolLoading: true });

      const res = await fetch(
        `${PATHS.BFF_API}/v1/pools?chainId=${chainId}&ids=${poolAddress}&protocol=${poolType}`
      ).then((res) => res.json());
      const { success, data, error } = poolResponse.safeParse({
        poolType,
        ...res,
      });

      const firstLoad = get().pool === "loading";
      if (!success) {
        firstLoad &&
          set({ errorMsg: `Can't get pool info ${error.toString()}` });
        console.error("Can't get pool info", error);
        set({ poolLoading: false });
        return;
      }
      const pool = data.data.pools.find(
        (item) => item.address.toLowerCase() === poolAddress.toLowerCase()
      );
      if (!pool) {
        firstLoad && set({ errorMsg: `Can't get pool info, address: ${pool}` });
        set({ poolLoading: false });
        return;
      }
      const token0Address = pool.tokens[0].address;
      const token1Address = pool.tokens[1].address;

      const prices = await fetchPrices([
        token0Address.toLowerCase(),
        token1Address.toLowerCase(),
      ]);

      const token0Price = prices[token0Address.toLowerCase()]?.PriceBuy || 0;
      const token1Price = prices[token1Address.toLowerCase()]?.PriceBuy || 0;

      const tokens: {
        address: string;
        logoURI?: string;
        name: string;
        symbol: string;
        decimals: number;
      }[] = await fetch(
        `https://ks-setting.kyberswap.com/api/v1/tokens?chainIds=${chainId}&addresses=${token0Address},${token1Address}`
      )
        .then((res) => res.json())
        .then((res) => res?.data?.tokens || [])
        .catch(() => []);

      let token0 = tokens.find(
        (tk) => tk.address.toLowerCase() === token0Address.toLowerCase()
      );
      let token1 = tokens.find(
        (tk) => tk.address.toLowerCase() === token1Address.toLowerCase()
      );

      if (!token0 || !token1) {
        const tokensToImport = [];
        if (!token0)
          tokensToImport.push({
            chainId: chainId.toString(),
            address: token0Address,
          });
        if (!token1)
          tokensToImport.push({
            chainId: chainId.toString(),
            address: token1Address,
          });

        const res = await fetch(
          `https://ks-setting.kyberswap.com/api/v1/tokens/import`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ tokens: tokensToImport }),
          }
        ).then((res) => res.json());

        if (!token0)
          token0 = res?.data?.tokens?.find(
            (item: { data: Token }) =>
              item.data.address.toLowerCase() === token0Address.toLowerCase()
          )?.data;
        if (!token1)
          token1 = res?.data?.tokens?.find(
            (item: { data: Token }) =>
              item.data.address.toLowerCase() === token1Address.toLowerCase()
          )?.data;

        if (!token0 || !token1) {
          set({ errorMsg: `Can't get token info` });
          set({ poolLoading: false });
          return;
        }
      }

      // check category pair
      const pairCheck = await fetch(
        `${PATHS.TOKEN_API}/v1/public/pair-category/check?chainId=${chainId}&tokenIn=${token0Address}&tokenOut=${token1Address}`
      ).then((res) => res.json());
      const cat = pairCheck?.data?.category || "commonPair";

      const { success: isUniV3, data: poolUniv3 } = univ3Pool.safeParse(pool);
      const { success: isUniV2, data: poolUniv2 } = univ2Pool.safeParse(pool);

      let p: Pool;

      if (isUniV3) {
        const { success: isUniV3PoolType, data: pt } =
          univ3PoolType.safeParse(poolType);
        if (!isUniV3PoolType) {
          throw new Error("Invalid pool univ3 type");
        }
        p = {
          category: cat,
          poolType: pt,
          address: poolUniv3.address,
          token0: {
            ...token0,
            logo: token0.logoURI,
            price: token0Price,
          },
          token1: {
            ...token1,
            logo: token1.logoURI,
            price: token1Price,
          },
          fee: pool.swapFee,
          liquidity: poolUniv3.positionInfo.liquidity,
          sqrtPriceX96: poolUniv3.positionInfo.sqrtPriceX96,
          tick: poolUniv3.positionInfo.tick,
          tickSpacing: poolUniv3.positionInfo.tickSpacing,
          ticks: poolUniv3.positionInfo.ticks,
          minTick: nearestUsableTick(
            MIN_TICK,
            poolUniv3.positionInfo.tickSpacing
          ),
          maxTick: nearestUsableTick(
            MAX_TICK,
            poolUniv3.positionInfo.tickSpacing
          ),
        };
        set({ pool: p });

        if (positionId !== undefined) {
          const contract = DexInfos[poolType].nftManagerContract;
          const contractAddress =
            typeof contract === "string" ? contract : contract[chainId];
          if (!contractAddress) {
            set({
              errorMsg: `Pool type ${poolType} is not supported in chainId: ${chainId}`,
            });
            set({ poolLoading: false });
            return;
          }
          // Function signature and encoded token ID
          const functionSignature = "positions(uint256)";
          const selector = getFunctionSelector(functionSignature);
          const encodedTokenId = encodeUint256(BigInt(positionId));

          const data = `0x${selector}${encodedTokenId}`;

          // JSON-RPC payload
          const payload = {
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
              {
                to: contractAddress,
                data: data,
              },
              "latest",
            ],
            id: 1,
          };

          // Send JSON-RPC request via fetch
          const response = await fetch(NetworkInfo[chainId].defaultRpc, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const { result, error } = await response.json();

          if (result && result !== "0x") {
            const data = decodePosition(result);

            const { amount0, amount1 } = getPositionAmounts(
              p.tick,
              data.tickLower,
              data.tickUpper,
              BigInt(p.sqrtPriceX96),
              data.liquidity
            );

            set({
              position: {
                id: +positionId,
                poolType: pt,
                liquidity: data.liquidity,
                tickLower: data.tickLower,
                tickUpper: data.tickUpper,
                amount0,
                amount1,
              },
            });
            set({ poolLoading: false });
            return;
          }

          set({ errorMsg: error.message || "Position not found" });
          set({ poolLoading: false });
        }
      } else if (isUniV2) {
        const { success: isUniV2PoolType, data: pt } =
          univ2PoolType.safeParse(poolType);
        if (!isUniV2PoolType) {
          set({ poolLoading: false });
          throw new Error("Invalid pool univ2 type");
        }
        p = {
          category: cat,
          poolType: pt,
          token0: {
            ...token0,
            logo: token0.logoURI,
            price: token0Price,
          },
          token1: {
            ...token1,
            logo: token1.logoURI,
            price: token1Price,
          },
          fee: pool.swapFee,
          reserves: poolUniv2.reserves,
        };

        set({ pool: p });
      } else {
        set({ poolLoading: false });
        throw new Error("Invalid pool type");
      }
      set({ poolLoading: false });
    },
    setConnectedAccount: (
      connectedAccount: WidgetProps["connectedAccount"]
    ) => {
      set({ connectedAccount });
    },
    toggleShowWidget: (newState: boolean) =>
      set(() => ({ showWidget: newState })),
  }));
};

type WidgetStore = ReturnType<typeof createWidgetStore>;

const WidgetContext = createContext<WidgetStore | null>(null);

export function WidgetProvider({ children, ...props }: WidgetProviderProps) {
  const store = useRef(createWidgetStore(props)).current;

  const { fetchPrices } = useTokenPrices({
    addresses: [],
    chainId: store.getState().chainId,
  });

  useEffect(() => {
    // get Pool and position then update store here
    store.getState().getPool(fetchPrices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update store when props change
  useEffect(() => {
    store.setState({
      ...props,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  return (
    <WidgetContext.Provider value={store}>{children}</WidgetContext.Provider>
  );
}

export function useWidgetContext<T>(selector: (state: WidgetState) => T): T {
  const store = useContext(WidgetContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  return useStore(store, selector);
}
