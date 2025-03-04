import { create } from "zustand";
import { usePoolsStore } from "./usePoolsStore";
import { usePositionStore } from "./usePositionStore";
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
  fetchZapRoute: (chainId: ChainId, client: string) => Promise<void>;
  fetchingRoute: boolean;
  route: GetRouteResponse | null;
  showPreview: boolean;
  togglePreview: () => void;
  degenMode: boolean;
  toggleDegenMode: () => void;
  showSetting: boolean;
  toggleSetting: (highlightDegenMode?: boolean) => void;
  ttl: number;
  setTtl: (value: number) => void;
  reset: () => void;
  highlightDegenMode: boolean;
  manualSlippage: boolean;
  setManualSlippage: (value: boolean) => void;
}

const initState = {
  showSetting: false,
  ttl: 20,
  degenMode: false,
  slippage: 50,
  showPreview: false,
  liquidityOut: 0n,
  tickLower: null,
  tickUpper: null,
  fetchingRoute: false,
  route: null,
  highlightDegenMode: false,
  manualSlippage: false,
};

export const useZapStateStore = create<ZapState>((set, get) => ({
  ...initState,
  reset: () => set(initState),
  setTtl: (value: number) => set({ ttl: value }),
  toggleSetting: (highlightDegenMode?: boolean) => {
    set((state) => ({
      showSetting: !state.showSetting,
      highlightDegenMode: Boolean(highlightDegenMode),
    }));
    if (highlightDegenMode) {
      setTimeout(() => {
        set({ highlightDegenMode: false });
      }, 4000);
    }
  },
  toggleDegenMode: () => set((state) => ({ degenMode: !state.degenMode })),
  setSlippage: (value: number) => set({ slippage: value }),
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
  setLiquidityOut: (liquidityOut: bigint) => set({ liquidityOut }),
  setTickLower: (tickLower: number) => set({ tickLower }),
  setTickUpper: (tickUpper: number) => set({ tickUpper }),
  fetchZapRoute: async (chainId: ChainId, client: string) => {
    const {
      liquidityOut,
      tickLower: lower,
      tickUpper: upper,
      slippage,
    } = get();
    const { pools } = usePoolsStore.getState();
    const { fromPosition: position, toPosition } = usePositionStore.getState();

    let tickLower = lower,
      tickUpper = upper;
    if (toPosition !== "loading" && toPosition !== null) {
      tickLower = toPosition.tickLower;
      tickUpper = toPosition.tickUpper;
    }

    if (
      pools === "loading" ||
      position === "loading" ||
      toPosition === "loading" ||
      liquidityOut === 0n ||
      tickLower === null ||
      tickUpper === null ||
      tickLower >= tickUpper
    ) {
      set({ route: null });
      return;
    }

    set({ fetchingRoute: true });

    const params: { [key: string]: string | number | boolean | undefined } = {
      slippage,
      dexFrom: pools[0].dex,
      "poolFrom.id": pools[0].address,
      "positionFrom.id": position.id,
      liquidityOut: liquidityOut.toString(),
      dexTo: pools[1].dex,
      "poolTo.id": pools[1].address,

      ...(toPosition?.id
        ? {
            "positionTo.id": toPosition.id,
          }
        : {
            "positionTo.tickLower": tickLower,
            "positionTo.tickUpper": tickUpper,
          }),
    };
    let tmp = "";
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined) tmp = `${tmp}&${key}=${params[key]}`;
    });

    try {
      const res = await fetch(
        `${ZAP_URL}/${
          NetworkInfo[chainId].zapPath
        }/api/v1/migrate/route?${tmp.slice(1)}`,
        {
          headers: {
            "x-client-id": client,
          },
        }
      ).then((res) => res.json());

      apiResponse.parse(res.data);
      set({ route: res.data, fetchingRoute: false });
    } catch (e) {
      console.log(e);
      set({ fetchingRoute: false, route: null });
    }
  },
  setManualSlippage: (value) => set({ manualSlippage: value }),
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
    fees: z.array(token).optional(),
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

const poolSwapAction = z.object({
  type: z.literal("ACTION_TYPE_POOL_SWAP"),
  poolSwap: z.object({
    swaps: z.array(
      z.object({
        tokenIn: token,
        tokenOut: token,
      })
    ),
  }),
});
export type PoolSwapAction = z.infer<typeof poolSwapAction>;

const protocolFeeAction = z.object({
  type: z.literal("ACTION_TYPE_PROTOCOL_FEE"),
  protocolFee: z.object({
    pcm: z.number(),
    tokens: z.array(token),
  }),
});

export type ProtocolFeeAction = z.infer<typeof protocolFeeAction>;

const refundAction = z.object({
  type: z.literal("ACTION_TYPE_REFUND"),
  refund: z.object({
    tokens: z.array(token),
  }),
});

export type RefundAction = z.infer<typeof refundAction>;

const apiResponse = z.object({
  poolDetails: z.object({
    category: z.string(), // TODO: "exotic_pair",
    uniswapV3: z
      .object({
        tick: z.number(),
        newTick: z.number(),
        sqrtP: z.string(),
        newSqrtP: z.string(),
      })
      .optional(),
    algebraV1: z
      .object({
        tick: z.number(),
        newTick: z.number(),
        sqrtP: z.string(),
        newSqrtP: z.string(),
      })
      .optional(),
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
        protocolFeeAction,
        aggregatorSwapAction,

        poolSwapAction,

        addliquidtyAction,
        refundAction,
      ])
    ),

    finalAmountUsd: z.string(),
    priceImpact: z.number().nullable().optional(),
    suggestedSlippage: z.number(),
  }),
  route: z.string(),
  routerAddress: z.string(),
});

export type GetRouteResponse = z.infer<typeof apiResponse>;
