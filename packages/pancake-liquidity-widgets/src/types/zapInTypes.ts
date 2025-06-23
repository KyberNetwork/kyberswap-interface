import { PancakeToken } from "@/entities/Pool";

export enum ZapAction {
  AGGREGATOR_SWAP = "ACTION_TYPE_AGGREGATOR_SWAP",
  POOL_SWAP = "ACTION_TYPE_POOL_SWAP",
  ADD_LIQUIDITY = "ACTION_TYPE_ADD_LIQUIDITY",
  REFUND = "ACTION_TYPE_REFUND",
  PARTNET_FEE = "ACTION_TYPE_PARTNER_FEE",
  PROTOCOL_FEE = "ACTION_TYPE_PROTOCOL_FEE",
}

export interface AddLiquidityAction {
  type: ZapAction.ADD_LIQUIDITY;
  addLiquidity: {
    token0: {
      address: string;
      amount: string;
      amountUsd: string;
    };
    token1: {
      address: string;
      amount: string;
      amountUsd: string;
    };
  };
}

export interface AggregatorSwapAction {
  type: ZapAction.AGGREGATOR_SWAP;
  aggregatorSwap: {
    swaps: Array<{
      tokenIn: {
        address: string;
        amount: string;
        amountUsd: string;
      };
      tokenOut: {
        address: string;
        amount: string;
        amountUsd: string;
      };
    }>;
  };
}

export interface PoolSwapAction {
  type: ZapAction.POOL_SWAP;
  poolSwap: {
    swaps: Array<{
      tokenIn: {
        address: string;
        amount: string;
        amountUsd: string;
      };
      tokenOut: {
        address: string;
        amount: string;
        amountUsd: string;
      };
    }>;
  };
}

export interface RefundAction {
  type: ZapAction.REFUND;
  refund: {
    tokens: Array<{
      address: string;
      amount: string;
      amountUsd: string;
    }>;
  };
}

export interface PartnerFeeAction {
  type: ZapAction.PARTNET_FEE;
  partnerFee: {
    pcm: number;
    tokens: Array<{
      address: string;
      amount: string;
      amountUsd: string;
    }>;
  };
}

export interface ProtocolFeeAction {
  type: ZapAction.PROTOCOL_FEE;
  protocolFee: {
    pcm: number;
    tokens: Array<{
      address: string;
      amount: string;
      amountUsd: string;
    }>;
  };
}

export interface ZapRouteDetail {
  poolDetails: {
    uniswapV3: {
      tick: number;
      newTick: number;
      sqrtP: string;
      newSqrtP: string;
    };
    algebraV1: {
      tick: number;
      newTick: number;
      sqrtP: string;
      newSqrtP: string;
    };
  };
  positionDetails: {
    addedLiquidity: string;
    addedAmountUsd: string;
  };
  zapDetails: {
    initialAmountUsd: string;
    actions: Array<
      | ProtocolFeeAction
      | AggregatorSwapAction
      | PoolSwapAction
      | AddLiquidityAction
      | RefundAction
      | PartnerFeeAction
    >;
    finalAmountUsd: string;
    priceImpact: number;
  };
  route: string;
  routerAddress: string;
  gas: string;
  gasUsd: string;
}

export enum Type {
  PriceLower = "PriceLower",
  PriceUpper = "PriceUpper",
}

export type PancakeTokenAdvanced = PancakeToken & {
  balance?: string | number | bigint;
  price?: number;
};
