import { create } from "zustand";
import { usePoolsStore } from "./usePoolsStore";
import { usePositionStore } from "./useFromPositionStore";
import { NetworkInfo, ZAP_URL } from "../constants";
import { ChainId } from "../schema";

import { z } from "zod";

interface ZapState {
  slippage: number;
  setSlippage: (value: number) => void;
  liquidityOut: bigint;
  tickLower: number | null;
  tickUpper: number | null;
  setTickLower: (tickLower: number) => void;
  setTickUpper: (tickUpper: number) => void;
  setLiquidityOut: (liquidity: bigint) => void;
  fetchZapRoute: (chainId: ChainId) => Promise<void>;
  fetchingRoute: boolean;
  route: GetRouteResponse | null;
  showPreview: boolean;
  togglePreview: () => void;
}

export const useZapStateStore = create<ZapState>((set, get) => ({
  slippage: 50,
  setSlippage: (value: number) => set({ slippage: value }),
  showPreview: false,
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
  liquidityOut: 0n,
  tickLower: null,
  tickUpper: null,
  fetchingRoute: false,
  route: null,
  setLiquidityOut: (liquidityOut: bigint) => set({ liquidityOut }),
  setTickLower: (tickLower: number) => set({ tickLower }),
  setTickUpper: (tickUpper: number) => set({ tickUpper }),
  fetchZapRoute: async (chainId: ChainId) => {
    const { liquidityOut, tickLower, tickUpper } = get();
    const { pools } = usePoolsStore.getState();
    const { position } = usePositionStore.getState();

    if (
      pools === "loading" ||
      position === "loading" ||
      liquidityOut === 0n ||
      tickLower === null ||
      tickUpper === null
    )
      return;

    set({ fetchingRoute: true });

    const params: { [key: string]: string | number | boolean } = {
      dexFrom: pools[0].dex,
      "poolFrom.id": pools[0].address,
      "positionFrom.id": position.id,
      liquidityOut: liquidityOut.toString(),
      dexTo: pools[1].dex,
      "poolTo.id": pools[1].address,
      "positionTo.tickLower": tickLower,
      "positionTo.tickUpper": tickUpper,
    };
    let tmp = "";
    Object.keys(params).forEach((key) => {
      tmp = `${tmp}&${key}=${params[key]}`;
    });

    try {
      // TODO: x-client-id
      const res = await fetch(
        `${ZAP_URL}/${
          NetworkInfo[chainId].zapPath
        }/api/v1/migrate/route?${tmp.slice(1)}`
      ).then((res) => res.json());

      apiResponse.parse(res.data);
      set({ route: res.data, fetchingRoute: false });
    } catch (e) {
      console.log(e);
      set({ fetchingRoute: false });
    }
  },
}));

const token = z.object({
  address: z.string(),
  amount: z.string(),
  amountUsd: z.string(),
});

const removeLiquidityAction = z.object({
  type: z.literal("ACTION_TYPE_REMOVE_LIQUIDITY"),
  removeLiquidity: z.object({
    tokens: z.array(token),
  }),
});

export type RemoveLiquidityAction = z.infer<typeof removeLiquidityAction>;

const aggregatorSwapAction = z.object({
  type: z.literal("ACTION_TYPE_AGGREGATOR_SWAP"),
  aggregatorSwap: z.object({
    swaps: z.array(
      z.object({
        tokenIn: token,
        tokenOut: token,
      })
    ),
  }),
});

export type AggregatorSwapAction = z.infer<typeof aggregatorSwapAction>;

const addliquidtyAction = z.object({
  type: z.literal("ACTION_TYPE_ADD_LIQUIDITY"),
  addLiquidity: z.object({
    token0: token,
    token1: token,
  }),
});

export type AddLiquidityAction = z.infer<typeof addliquidtyAction>;

const apiResponse = z.object({
  poolDetails: z.object({
    category: z.string(), // TODO: "exotic_pair",
    uniswapV3: z.object({
      tick: z.number(),
      newTick: z.number(),
      sqrtP: z.string(),
      newSqrtP: z.string(),
    }),
  }),

  positionDetails: z.object({
    addedLiquidity: z.string(),
    addedAmountUsd: z.string(),
  }),

  zapDetails: z.object({
    initialAmountUsd: z.string(),
    actions: z.array(
      z.discriminatedUnion("type", [
        removeLiquidityAction,
        z.object({
          type: z.literal("ACTION_TYPE_PROTOCOL_FEE"),
          protocolFee: z.object({
            pcm: z.number(),
            tokens: z.array(token),
          }),
        }),

        aggregatorSwapAction,

        z.object({
          type: z.literal("ACTION_TYPE_POOL_SWAP"),
          poolSwap: z.object({
            swaps: z.array(
              z.object({
                tokenIn: token,
                tokenOut: token,
              })
            ),
          }),
        }),

        addliquidtyAction,

        z.object({
          type: z.literal("ACTION_TYPE_REFUND"),
          refund: z.object({
            tokens: z.array(token),
          }),
        }),
      ])
    ),

    finalAmountUsd: z.string(),
    priceImpact: z.number(),
  }),
  route: z.string(),
  routerAddress: z.string(),
});

export type GetRouteResponse = z.infer<typeof apiResponse>;
