import { z } from 'zod';

const token = z.object({
  address: z.string(),
  amount: z.string(),
  amountUsd: z.string(),
});

const removeLiquidityAction = z.object({
  type: z.literal('ACTION_TYPE_REMOVE_LIQUIDITY'),
  removeLiquidity: z.object({
    tokens: z.array(token),
  }),
});

// eslint-disable-next-line
export type RemoveLiquidityAction = z.infer<typeof removeLiquidityAction>;

const aggregatorSwapAction = z.object({
  type: z.literal('ACTION_TYPE_AGGREGATOR_SWAP'),
  aggregatorSwap: z.object({
    swaps: z.array(
      z.object({
        tokenIn: token,
        tokenOut: token,
      }),
    ),
  }),
});

// eslint-disable-next-line
export type AggregatorSwapAction = z.infer<typeof aggregatorSwapAction>;

const addliquidtyAction = z.object({
  type: z.literal('ACTION_TYPE_ADD_LIQUIDITY'),
  addLiquidity: z.object({
    token0: token,
    token1: token,
  }),
});

// eslint-disable-next-line
export type AddLiquidityAction = z.infer<typeof addliquidtyAction>;

const poolSwapAction = z.object({
  type: z.literal('ACTION_TYPE_POOL_SWAP'),
  poolSwap: z.object({
    swaps: z.array(
      z.object({
        tokenIn: token,
        tokenOut: token,
      }),
    ),
  }),
});
// eslint-disable-next-line
export type PoolSwapAction = z.infer<typeof poolSwapAction>;

const protocolFeeAction = z.object({
  type: z.literal('ACTION_TYPE_PROTOCOL_FEE'),
  protocolFee: z.object({
    pcm: z.number(),
    tokens: z.array(token),
  }),
});

// eslint-disable-next-line
export type ProtocolFeeAction = z.infer<typeof protocolFeeAction>;

const refundAction = z.object({
  type: z.literal('ACTION_TYPE_REFUND'),
  refund: z.object({
    tokens: z.array(token),
  }),
});

// eslint-disable-next-line
export type RefundAction = z.infer<typeof refundAction>;

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
      z.discriminatedUnion('type', [
        removeLiquidityAction,
        protocolFeeAction,
        aggregatorSwapAction,

        poolSwapAction,

        addliquidtyAction,
        refundAction,
      ]),
    ),

    finalAmountUsd: z.string(),
    priceImpact: z.number(),
  }),
  route: z.string(),
  routerAddress: z.string(),
});

// eslint-disable-next-line
export type GetRouteResponse = z.infer<typeof apiResponse>;
