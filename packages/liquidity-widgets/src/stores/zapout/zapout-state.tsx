import { PATHS, chainIdToChain, poolTypeToDexId } from "@/constants";
import { ChainId, PoolType, Token } from "@/schema";
import { z } from "zod";
import { create } from "zustand";

interface ZapOutUserState {
  ttl: number;
  setTtl: (value: number) => void;

  showSetting: boolean;
  toggleSetting: (highlightDegenMode?: boolean) => void;

  degenMode: boolean;
  toggleDegenMode: () => void;

  revertPrice: boolean;
  toggleRevertPrice: () => void;

  slippage: number;
  setSlippage: (value: number) => void;

  liquidityOut: bigint;
  setLiquidityOut: (liquidity: bigint) => void;

  tokenOut: Token | null;
  setTokenOut: (token: Token) => void;

  showPreview: boolean;
  togglePreview: () => void;

  fetchingRoute: boolean;
  route: GetZapOutRouteResponse | null;
  fetchZapOutRoute: (params: {
    chainId: ChainId;
    poolType: PoolType;
    poolAddress: string;
    positionId: string;
  }) => Promise<void>;
  highlightDegenMode: boolean;
  manualSlippage: boolean;
  setManualSlippage: (value: boolean) => void;
  resetState: () => void;
}

const initState = {
  ttl: 20,
  tokenOut: null,
  showSetting: false,
  highlightDegenMode: false,
  degenMode: false,
  revertPrice: false,
  slippage: 50,
  liquidityOut: 0n,
  showPreview: false,
  fetchingRoute: false,
  route: null,
  manualSlippage: false,
};

export const useZapOutUserState = create<ZapOutUserState>((set, get) => ({
  ...initState,
  resetState: () => set({ ...initState }),
  setTtl: (value: number) => set({ ttl: value }),
  setTokenOut: (token) => set({ tokenOut: token }),
  toggleSetting: (highlightDegenMode) => {
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

  toggleRevertPrice: () =>
    set((state) => ({ revertPrice: !state.revertPrice })),

  setSlippage: (value: number) => set({ slippage: value }),

  setLiquidityOut: (liquidityOut: bigint) => set({ liquidityOut }),

  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),

  fetchZapOutRoute: async ({ chainId, poolType, positionId, poolAddress }) => {
    const { tokenOut, liquidityOut, slippage } = get();

    if (!tokenOut?.address || liquidityOut === 0n) {
      set({ fetchingRoute: false, route: null });
      return;
    }

    const params: { [key: string]: string | number | boolean } = {
      dexFrom: poolTypeToDexId[poolType],
      "poolFrom.id": poolAddress,
      "positionFrom.id": positionId,
      liquidityOut: liquidityOut.toString(),
      tokenOut: tokenOut.address,
      slippage,
    };

    let search = "";
    Object.keys(params).forEach((key) => {
      search = `${search}&${key}=${params[key]}`;
    });

    try {
      const res = await fetch(
        `${PATHS.ZAP_API}/${
          chainIdToChain[chainId]
        }/api/v1/out/route?${search.slice(1)}`
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

const refundAction = z.object({
  type: z.literal("ACTION_TYPE_REFUND"),
  refund: z.object({
    tokens: z.array(token),
  }),
});

export type RefundAction = z.infer<typeof refundAction>;

const apiResponse = z.object({
  zapDetails: z.object({
    initialAmountUsd: z.string(),
    actions: z.array(
      z.discriminatedUnion("type", [
        removeLiquidityAction,

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

        refundAction,

        z.object({
          type: z.literal("ACTION_TYPE_PROTOCOL_FEE"),
          protocolFee: z.object({
            pcm: z.number(),
            tokens: z.array(token),
          }),
        }),

        //z.object({
        //  type: z.literal("ACTION_TYPE_PARTNER_FEE"),
        //  protocolFee: z.object({
        //    pcm: z.number(),
        //    tokens: z.array(token),
        //  }),
        //}),
      ])
    ),

    finalAmountUsd: z.string(),
    priceImpact: z.number().nullable().optional(),
    suggestedSlippage: z.number(),
  }),
  route: z.string(),
  routerAddress: z.string(),
});

export type GetZapOutRouteResponse = z.infer<typeof apiResponse>;
