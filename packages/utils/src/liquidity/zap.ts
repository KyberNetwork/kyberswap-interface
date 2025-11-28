import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PartnerFeeAction,
  PoolSwapAction,
  Position,
  ProtocolFeeAction,
  RefundAction,
  RemoveLiquidityAction,
  Token,
  ZapAction,
  ZapRouteDetail,
} from '@kyber/schema';

import { formatUnits } from '../crypto';
import { formatDisplayNumber, toRawString } from '../number';
import { PI_LEVEL, ZAP_MESSAGES, getZapImpact } from './price-impact';

export const parseZapInfo = ({
  zapInfo,
  token0,
  token1,
  position,
}: {
  zapInfo: ZapRouteDetail | undefined | null;
  token0: Token;
  token1: Token;
  position: Position | undefined | null | 'loading';
}) => {
  if (!zapInfo)
    return {
      refundInfo: {
        refundAmount0: 0,
        refundAmount1: 0,
        refundUsd: 0,
      },
      addedAmountInfo: {
        addedAmount0: 0,
        addedAmount1: 0,
        addedAmount0Usd: 0,
        addedAmount1Usd: 0,
      },
      initUsd: 0,
      suggestedSlippage: 0,
      isHighRemainingAmount: false,
      feeInfo: {
        protocolFee: 0,
        partnerFee: 0,
      },
      positionAmountInfo: {
        amount0: 0,
        amount1: 0,
        positionAmount0Usd: 0,
        positionAmount1Usd: 0,
        addedAmountUsd: 0,
      },
      zapImpact: {
        level: PI_LEVEL.NORMAL,
        display: '',
        msg: '',
      },
    };

  const addLiquidityInfo = zapInfo.zapDetails.actions.find(
    item => item.type === ZapAction.ADD_LIQUIDITY,
  ) as AddLiquidityAction;

  const refundData = zapInfo.zapDetails.actions.find(item => item.type === ZapAction.REFUND) as RefundAction | null;
  const refundToken0 =
    refundData?.refund.tokens.filter(item => item.address.toLowerCase() === token0.address.toLowerCase()) || [];
  const refundToken1 =
    refundData?.refund.tokens.filter(item => item.address.toLowerCase() === token1.address.toLowerCase()) || [];
  const refundAmount0 = formatDisplayNumber(
    formatUnits(refundToken0.reduce((acc, cur) => acc + BigInt(cur.amount), 0n).toString(), token0.decimals),
    { significantDigits: 6 },
  );
  const refundAmount1 = formatDisplayNumber(
    formatUnits(refundToken1.reduce((acc, cur) => acc + BigInt(cur.amount), 0n).toString(), token1.decimals),
    { significantDigits: 6 },
  );
  const refundUsd = refundData?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) || 0;

  const addedAmount0 = formatUnits(addLiquidityInfo?.addLiquidity.token0.amount || '0', token0.decimals);
  const addedAmount1 = formatUnits(addLiquidityInfo?.addLiquidity.token1.amount || '0', token1.decimals);
  const addedAmount0Usd = +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0);
  const addedAmount1Usd = +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0);

  const initUsd = Number(zapInfo?.zapDetails.initialAmountUsd || 0);
  const suggestedSlippage = zapInfo?.zapDetails.suggestedSlippage;
  const isHighRemainingAmount = initUsd ? refundUsd / initUsd >= suggestedSlippage / 10_000 : false;

  const feeInfo = zapInfo?.zapDetails.actions.find(item => item.type === ZapAction.PROTOCOL_FEE) as ProtocolFeeAction;
  const partnerFeeInfo = zapInfo?.zapDetails.actions.find(
    item => item.type === ZapAction.PARTNET_FEE,
  ) as PartnerFeeAction;
  const protocolFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const partnerFee = ((partnerFeeInfo?.partnerFee.pcm || 0) / 100_000) * 100;

  const amount0 = position === 'loading' || !position ? 0 : +toRawString(position.amount0, token0.decimals);
  const amount1 = position === 'loading' || !position ? 0 : +toRawString(position.amount1, token1.decimals);
  const positionAmount0Usd = (amount0 * +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0)) / +addedAmount0 || 0;
  const positionAmount1Usd = (amount1 * +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0)) / +addedAmount1 || 0;
  const addedAmountUsd = +(zapInfo?.positionDetails.addedAmountUsd || 0) + positionAmount0Usd + positionAmount1Usd || 0;

  const zapImpact = getZapImpact(zapInfo.zapDetails.priceImpact, zapInfo.zapDetails.suggestedSlippage || 100);

  return {
    refundInfo: {
      refundAmount0,
      refundAmount1,
      refundUsd,
    },
    addedAmountInfo: {
      addedAmount0: +addedAmount0,
      addedAmount1: +addedAmount1,
      addedAmount0Usd: +addedAmount0Usd,
      addedAmount1Usd: +addedAmount1Usd,
    },
    initUsd,
    suggestedSlippage,
    isHighRemainingAmount,
    feeInfo: {
      protocolFee,
      partnerFee,
    },
    positionAmountInfo: {
      amount0,
      amount1,
      positionAmount0Usd,
      positionAmount1Usd,
      addedAmountUsd,
    },
    zapImpact,
  };
};

// NEW
const defaultZapImpact = {
  msg: ZAP_MESSAGES.UNABLE_TO_CALCULATE,
  level: PI_LEVEL.INVALID,
  display: '--',
};

const defaultZapRoute = {
  addedLiquidity: {
    addedAmount0: 0n,
    addedAmount1: 0n,
    addedValue0: 0,
    addedValue1: 0,
  },
  removeLiquidity: {
    removedAmount0: 0n,
    removedAmount1: 0n,
    removedValue0: 0,
    removedValue1: 0,
  },
  earnedFee: {
    earnedFee0: 0n,
    earnedFee1: 0n,
    feeValue0: 0,
    feeValue1: 0,
  },
  refund: {
    value: 0,
    refunds: [],
  },
  zapFee: {
    protocolFee: 0,
    partnerFee: 0,
  },
  suggestedSlippage: 0,
  initUsd: 0,
  finalAmountUsd: 0,
  gasUsd: 0,
  zapImpact: defaultZapImpact,
  swapActions: [],
};

export const parseZapRoute = ({
  route,
  token0Address,
  token1Address,
  tokens,
  dexName,
  poolAddress,
}: {
  route: ZapRouteDetail | null;
  token0Address: string;
  token1Address: string;
  tokens: Token[];
  dexName: string;
  poolAddress: string;
}) => {
  if (!route || !token0Address || !token1Address) return defaultZapRoute;

  const addedLiquidity = parseAddedLiquidity(route);
  const removeLiquidity = parseRemoveLiquidity(route, token0Address, token1Address);
  const earnedFee = parseEarnedFee(route, token0Address, token1Address);
  const suggestedSlippage = route.zapDetails.suggestedSlippage || 0;
  const initUsd = Number(route?.zapDetails.initialAmountUsd || 0);
  const finalAmountUsd = Number(route?.zapDetails.finalAmountUsd || 0);
  const gasUsd = Number(route?.gasUsd || 0);
  const refund = parseRefund(route, tokens);
  const zapFee = parseZapFee(route);
  const zapImpact = parseZapImpact(route.zapDetails.priceImpact, suggestedSlippage);
  const swapActions = parseSwapActions(route, tokens, dexName, poolAddress);

  return {
    addedLiquidity,
    removeLiquidity,
    earnedFee,
    suggestedSlippage,
    refund,
    initUsd,
    finalAmountUsd,
    gasUsd,
    zapFee,
    zapImpact,
    swapActions,
  };
};

const parseAddedLiquidity = (route: ZapRouteDetail) => {
  const addLiquidityInfo = route.zapDetails.actions.find(
    item => item.type === ZapAction.ADD_LIQUIDITY,
  ) as AddLiquidityAction;

  const token0 = addLiquidityInfo?.addLiquidity.token0;
  const token1 = addLiquidityInfo?.addLiquidity.token1;

  const addedAmount0 = BigInt(token0?.amount || '0');
  const addedAmount1 = BigInt(token1?.amount || '0');
  const addedValue0 = +(token0?.amountUsd || 0);
  const addedValue1 = +(token1?.amountUsd || 0);

  return {
    addedAmount0,
    addedAmount1,
    addedValue0,
    addedValue1,
  };
};

const parseRemoveLiquidity = (route: ZapRouteDetail, token0Address: string, token1Address: string) => {
  const actionRemoveLiquidity = route?.zapDetails.actions.find(item => item.type === ZapAction.REMOVE_LIQUIDITY) as
    | RemoveLiquidityAction
    | undefined;

  const token0 = actionRemoveLiquidity?.removeLiquidity.tokens.find(
    item => item.address.toLowerCase() === token0Address.toLowerCase(),
  );
  const token1 = actionRemoveLiquidity?.removeLiquidity.tokens.find(
    item => item.address.toLowerCase() === token1Address.toLowerCase(),
  );

  const removedAmount0 = BigInt(token0?.amount || '0');
  const removedAmount1 = BigInt(token1?.amount || '0');
  const removedValue0 = +(token0?.amountUsd || 0);
  const removedValue1 = +(token1?.amountUsd || 0);

  return {
    removedAmount0,
    removedAmount1,
    removedValue0,
    removedValue1,
  };
};

const parseEarnedFee = (route: ZapRouteDetail, token0Address: string, token1Address: string) => {
  const actionRemoveLiquidity = route?.zapDetails.actions.find(item => item.type === ZapAction.REMOVE_LIQUIDITY) as
    | RemoveLiquidityAction
    | undefined;

  const token0 = actionRemoveLiquidity?.removeLiquidity.fees?.find(
    item => item.address.toLowerCase() === token0Address.toLowerCase(),
  );
  const token1 = actionRemoveLiquidity?.removeLiquidity.fees?.find(
    item => item.address.toLowerCase() === token1Address.toLowerCase(),
  );

  const feeAmount0 = BigInt(token0 ? token0.amount : 0);
  const feeAmount1 = BigInt(token1 ? token1.amount : 0);
  const feeValue0 = +(token0 ? token0.amountUsd : 0);
  const feeValue1 = +(token1 ? token1.amountUsd : 0);

  return {
    earnedFee0: feeAmount0,
    earnedFee1: feeAmount1,
    feeValue0,
    feeValue1,
  };
};

const parseRefund = (route: ZapRouteDetail, tokens: Token[]) => {
  const refundInfo = route?.zapDetails.actions.find(item => item.type === ZapAction.REFUND) as RefundAction | null;

  const refundUsd = refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) || 0;
  const refunds: { amount: string; symbol: string }[] = [];
  refundInfo?.refund.tokens.forEach(refund => {
    const token = tokens.find(t => t.address.toLowerCase() === refund.address.toLowerCase());
    if (token) {
      refunds.push({
        amount: formatUnits(refund.amount, token.decimals),
        symbol: token.symbol,
      });
    }
  });

  return {
    value: refundUsd,
    refunds,
  };
};

const parseZapFee = (route: ZapRouteDetail) => {
  const feeInfo = route.zapDetails.actions.find(item => item.type === ZapAction.PROTOCOL_FEE) as ProtocolFeeAction;
  const partnerFeeInfo = route.zapDetails.actions.find(item => item.type === ZapAction.PARTNET_FEE) as PartnerFeeAction;
  const protocolFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const partnerFee = ((partnerFeeInfo?.partnerFee.pcm || 0) / 100_000) * 100;

  return {
    protocolFee,
    partnerFee,
  };
};

const parseZapImpact = (pi: number | null | undefined, suggestedSlippage: number) => {
  if (pi === null || pi === undefined || isNaN(pi)) return defaultZapImpact;

  const piDisplay = pi < 0.01 ? '<0.01%' : pi.toFixed(2) + '%';

  const warningThreshold = (2 * suggestedSlippage * 100) / 10_000;

  if (pi > 2 * warningThreshold) {
    return {
      msg: ZAP_MESSAGES.ZAP_IMPACT_HIGH,
      level: PI_LEVEL.VERY_HIGH,
      display: piDisplay,
    };
  }

  if (pi > warningThreshold) {
    return {
      msg: ZAP_MESSAGES.ZAP_IMPACT_WARNING,
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

const parseSwapActions = (route: ZapRouteDetail, tokens: Token[], dexName: string, poolAddress: string) => {
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
        pool: 'KyberSwap',
        poolAddress: '',
      };
    }) || [];

  const parsedPoolSwapInfo =
    poolSwapInfo?.poolSwap?.swaps?.map(item => {
      const tokenIn = tokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase());
      const tokenOut = tokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase());
      const amountIn = formatUnits(item.tokenIn.amount, tokenIn?.decimals);
      const amountOut = formatUnits(item.tokenOut.amount, tokenOut?.decimals);

      const displayPool =
        item.poolAddress && poolAddress && item.poolAddress !== poolAddress
          ? `${tokenIn?.symbol}-${tokenOut?.symbol}`
          : dexName;

      return {
        tokenInSymbol: tokenIn?.symbol || '--',
        tokenOutSymbol: tokenOut?.symbol || '--',
        amountIn,
        amountOut,
        pool: ZAP_MESSAGES.DISPLAY_POOL.replace('{displayPool}', displayPool),
        poolAddress: item.poolAddress || '',
      };
    }) || [];

  return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
};
