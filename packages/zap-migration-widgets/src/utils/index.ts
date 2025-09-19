import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PoolSwapAction,
  ProtocolFeeAction,
  RefundAction,
  RemoveLiquidityAction,
  Token,
  ZapAction,
  ZapRouteDetail,
} from '@kyber/schema';
import { formatUnits } from '@kyber/utils/crypto';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 }).format(value);

export const formatWei = (value?: string, decimals?: number) => {
  if (value && decimals) return formatNumber(+formatUnits(value, decimals).toString());

  return '--';
};

export enum PairType {
  Stable = 'stable',
  Correlated = 'correlated',
  Common = 'common',
  Exotic = 'exotic',
}

export enum PI_LEVEL {
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
  NORMAL = 'NORMAL',
  INVALID = 'INVALID',
}

const defaultZapImpact = {
  msg: `Unable to calculate zap impact`,
  level: PI_LEVEL.INVALID,
  display: '--',
};

const defaultZapRoute = {
  addedLiquidity: {
    addedAmount0: '0',
    addedAmount1: '0',
    addedValue0: 0,
    addedValue1: 0,
  },
  earnedFee: {
    earnedFee0: 0n,
    earnedFee1: 0n,
  },
  refund: {
    value: 0,
  },
  zapFee: 0,
  suggestedSlippage: 0,
  initUsd: 0,
  zapImpact: defaultZapImpact,
  swapActions: [],
};

export const parseZapRoute = (route: ZapRouteDetail | null, tokens: Token[]) => {
  if (!route) return defaultZapRoute;

  const addedLiquidity = parseAddedLiquidity(route);
  const earnedFee = parseEarnedFee(route);
  const suggestedSlippage = route.zapDetails.suggestedSlippage || 0;
  const initUsd = Number(route?.zapDetails.initialAmountUsd || 0);
  const refund = parseRefund(route);
  const zapFee = parseZapFee(route);
  const zapImpact = parseZapImpact(route.zapDetails.priceImpact, suggestedSlippage);
  const swapActions = parseSwapActions(route, tokens);

  return {
    addedLiquidity,
    earnedFee,
    suggestedSlippage,
    refund,
    initUsd,
    zapFee,
    zapImpact,
    swapActions,
  };
};

const parseAddedLiquidity = (route: ZapRouteDetail) => {
  const addLiquidityInfo = route.zapDetails.actions.find(
    item => item.type === ZapAction.ADD_LIQUIDITY,
  ) as AddLiquidityAction;

  const addedAmount0 = addLiquidityInfo?.addLiquidity.token0.amount || '0';
  const addedAmount1 = addLiquidityInfo?.addLiquidity.token1.amount || '0';
  const addedValue0 = +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0);
  const addedValue1 = +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0);

  return {
    addedAmount0,
    addedAmount1,
    addedValue0,
    addedValue1,
  };
};

const parseEarnedFee = (route: ZapRouteDetail) => {
  const actionRemoveLiquidity = route?.zapDetails.actions.find(item => item.type === ZapAction.REMOVE_LIQUIDITY) as
    | RemoveLiquidityAction
    | undefined;

  const { fees } = actionRemoveLiquidity?.removeLiquidity || {};
  const fee0 = fees?.[0];
  const fee1 = fees?.[1];

  const feeAmount0 = BigInt(fee0 ? fee0.amount : 0);
  const feeAmount1 = BigInt(fee1 ? fee1.amount : 0);

  return {
    earnedFee0: feeAmount0,
    earnedFee1: feeAmount1,
  };
};

const parseRefund = (route: ZapRouteDetail) => {
  const refundInfo = route?.zapDetails.actions.find(item => item.type === ZapAction.REFUND) as RefundAction | null;

  const refundUsd = refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) || 0;

  return {
    value: refundUsd,
  };
};

const parseZapFee = (route: ZapRouteDetail) => {
  const feeInfo = route?.zapDetails.actions.find(item => item.type === ZapAction.PROTOCOL_FEE) as
    | ProtocolFeeAction
    | undefined;

  const zapFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;

  return zapFee;
};

const parseZapImpact = (pi: number | null | undefined, suggestedSlippage: number) => {
  if (pi === null || pi === undefined || isNaN(pi)) return defaultZapImpact;

  const piDisplay = pi < 0.01 ? '<0.01%' : pi.toFixed(2) + '%';

  const warningThreshold = (2 * suggestedSlippage * 100) / 10_000;

  if (pi > 2 * warningThreshold) {
    return {
      msg: "Overall zap price impact is higher than expected. Click 'Zap Anyway' if you wish to proceed in Degen Mode.",
      level: PI_LEVEL.VERY_HIGH,
      display: piDisplay,
    };
  }

  if (pi > warningThreshold) {
    return {
      msg: 'Overall zap price impact is higher than expected.',
      level: PI_LEVEL.HIGH,
      display: piDisplay,
    };
  }

  return {
    msg: '',
    level: PI_LEVEL.NORMAL,
    display: piDisplay,
  };
};

const parseSwapActions = (route: ZapRouteDetail, tokens: Token[]) => {
  const aggregatorSwapInfo = route?.zapDetails.actions.find(
    item => item.type === ZapAction.AGGREGATOR_SWAP,
  ) as AggregatorSwapAction | null;

  const poolSwapInfo = route?.zapDetails.actions.find(
    item => item.type === ZapAction.POOL_SWAP,
  ) as PoolSwapAction | null;

  const parsedAggregatorSwapInfo =
    aggregatorSwapInfo?.aggregatorSwap?.swaps?.map(item => {
      const tokenIn = tokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase());
      const tokenOut = tokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase());
      const amountIn = formatUnits(item.tokenIn.amount, tokenIn?.decimals);
      const amountOut = formatUnits(item.tokenOut.amount, tokenOut?.decimals);

      return {
        tokenInSymbol: tokenIn?.symbol || '--',
        tokenOutSymbol: tokenOut?.symbol || '--',
        amountIn,
        amountOut,
      };
    }) || [];

  const parsedPoolSwapInfo =
    poolSwapInfo?.poolSwap?.swaps?.map(item => {
      const tokenIn = tokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase());

      const tokenOut = tokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase());

      const amountIn = formatUnits(item.tokenIn.amount, tokenIn?.decimals);
      const amountOut = formatUnits(item.tokenOut.amount, tokenOut?.decimals);

      return {
        tokenInSymbol: tokenIn?.symbol || '--',
        tokenOutSymbol: tokenOut?.symbol || '--',
        amountIn,
        amountOut,
      };
    }) || [];

  return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
};
