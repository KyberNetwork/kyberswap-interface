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
  //Token,
  //tick,
  //token,
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
}

interface WidgetState extends WidgetProps {
  theme: Theme;
  pool: "loading" | Pool;
  position: "loading" | Position;
  errorMsg: string;

  getPool: (
    fetchPrices: (
      address: string[]
    ) => Promise<{ [key: string]: { PriceBuy: number } }>
  ) => void;
}

type WidgetProviderProps = React.PropsWithChildren<WidgetProps>;

const createWidgetStore = (initProps: WidgetProps) => {
  return createStore<WidgetState>()((set, get) => ({
    ...initProps,
    theme: initProps.theme || defaultTheme,
    pool: "loading",
    position: "loading",
    errorMsg: "",

    getPool: async (fetchPrices) => {
      const { poolAddress, chainId, poolType, positionId } = get();

      const res = await fetch(
        `${PATHS.BFF_API}/v1/pools?chainId=${chainId}&ids=${poolAddress}`
      ).then((res) => res.json());
      const { success, data, error } = poolResponse.safeParse(res);

      const firstLoad = get().pool === "loading";
      if (!success) {
        firstLoad &&
          set({ errorMsg: `Can't get pool info ${error.toString()}` });
        console.error("Can't get pool info", error);
        return;
      }
      const pool = data.data.pools.find(
        (item) => item.address.toLowerCase() === poolAddress.toLowerCase()
      );
      if (!pool) {
        firstLoad && set({ errorMsg: `Can't get pool info, address: ${pool}` });
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

      const token0 = tokens.find(
        (tk) => tk.address.toLowerCase() === token0Address.toLowerCase()
      );
      const token1 = tokens.find(
        (tk) => tk.address.toLowerCase() === token1Address.toLowerCase()
      );

      if (!token0 || !token1) {
        set({ errorMsg: `Can't get token info` });
        return;
      }

      const p: Pool = {
        address: pool.address,
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
        liquidity: pool.positionInfo.liquidity,
        sqrtPriceX96: pool.positionInfo.sqrtPriceX96,
        tick: pool.positionInfo.tick,
        tickSpacing: pool.positionInfo.tickSpacing,
        ticks: pool.positionInfo.ticks,
        poolType,
        minTick: nearestUsableTick(MIN_TICK, pool.positionInfo.tickSpacing),
        maxTick: nearestUsableTick(MAX_TICK, pool.positionInfo.tickSpacing),
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
              poolType,
              liquidity: data.liquidity,
              tickLower: data.tickLower,
              tickUpper: data.tickUpper,
              amount0,
              amount1,
            },
          });
          return;
        }

        set({ errorMsg: error.message || "Position not found" });
      }
    },
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
    const i = setInterval(() => {
      store.getState().getPool(fetchPrices);
    }, 15_000);
    return () => clearInterval(i);
  }, []);

  return (
    <WidgetContext.Provider value={store}>{children}</WidgetContext.Provider>
  );
}

export function useWidgetContext<T>(selector: (state: WidgetState) => T): T {
  const store = useContext(WidgetContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  return useStore(store, selector);
}
