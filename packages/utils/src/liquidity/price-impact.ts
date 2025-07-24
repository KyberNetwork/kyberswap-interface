import { ChainId, DEXES_INFO, PoolSwapAction, PoolType, ZapAction } from '@kyber/schema';
import { AggregatorSwapAction, Token, ZapRouteDetail } from '@kyber/schema';

import { formatWei } from '../number';

export enum PI_LEVEL {
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
  NORMAL = 'NORMAL',
  INVALID = 'INVALID',
}

export const getPriceImpact = (
  pi: number | null | undefined,
  type: 'Swap Price Impact' | 'Zap Impact',
  suggestedSlippage: number,
) => {
  if (pi === null || pi === undefined || isNaN(pi))
    return {
      msg: `Unable to calculate ${type}`,
      level: PI_LEVEL.INVALID,
      display: '--',
    };

  const piDisplay = pi < 0.01 ? '<0.01%' : pi.toFixed(2) + '%';

  const warningThreshold = (2 * suggestedSlippage * 100) / 10_000;

  if (pi > 2 * warningThreshold) {
    return {
      msg:
        type === 'Swap Price Impact'
          ? 'The price impact for this swap is higher than usual, which may affect trade outcomes.'
          : "Overall zap price impact is higher than expected. Click 'Zap Anyway' if you wish to proceed in Degen Mode.",

      level: type === 'Swap Price Impact' ? PI_LEVEL.HIGH : PI_LEVEL.VERY_HIGH,
      display: piDisplay,
    };
  }

  if (pi > warningThreshold) {
    return {
      msg:
        type === 'Swap Price Impact'
          ? 'The price impact for this swap is higher than usual, which may affect trade outcomes.'
          : 'Overall zap price impact is higher than expected.',
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

export interface SwapAction {
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amountIn: string;
  amountOut: string;
  piRes: {
    msg: string;
    level: PI_LEVEL;
    display: string;
  };
}

export const parseSwapActions = ({
  zapInfo,
  tokens,
  poolType,
  chainId,
}: {
  zapInfo: ZapRouteDetail | undefined | null;
  tokens: Token[];
  poolType: PoolType;
  chainId: ChainId;
}) => {
  if (!zapInfo) return [];

  const aggregatorSwapInfo = zapInfo.zapDetails.actions.find(
    item => item.type === ZapAction.AGGREGATOR_SWAP,
  ) as AggregatorSwapAction | null;

  const poolSwapInfo = zapInfo.zapDetails.actions.find(
    item => item.type === ZapAction.POOL_SWAP,
  ) as PoolSwapAction | null;

  const dexNameObj = DEXES_INFO[poolType].name;
  const dexName = typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId];

  const parsedAggregatorSwapInfo =
    aggregatorSwapInfo?.aggregatorSwap?.swaps?.map(item => {
      const tokenIn = tokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase());
      const tokenOut = tokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase());
      const amountIn = formatWei(item.tokenIn.amount, tokenIn?.decimals);
      const amountOut = formatWei(item.tokenOut.amount, tokenOut?.decimals);

      const pi =
        parseFloat(item.tokenIn.amountUsd) === 0
          ? 0
          : ((parseFloat(item.tokenIn.amountUsd) - parseFloat(item.tokenOut.amountUsd)) /
              parseFloat(item.tokenIn.amountUsd)) *
            100;

      const piRes = getPriceImpact(pi, 'Swap Price Impact', zapInfo?.zapDetails.suggestedSlippage || 100);

      return {
        tokenInSymbol: tokenIn?.symbol || '--',
        tokenOutSymbol: tokenOut?.symbol || '--',
        amountIn,
        amountOut,
        pool: 'KyberSwap',
        piRes,
      };
    }) || [];

  const parsedPoolSwapInfo =
    poolSwapInfo?.poolSwap?.swaps?.map(item => {
      const tokenIn = tokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase());
      const tokenOut = tokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase());
      const amountIn = formatWei(item.tokenIn.amount, tokenIn?.decimals);
      const amountOut = formatWei(item.tokenOut.amount, tokenOut?.decimals);

      const pi =
        parseFloat(item.tokenIn.amountUsd) === 0
          ? 0
          : ((parseFloat(item.tokenIn.amountUsd) - parseFloat(item.tokenOut.amountUsd)) /
              parseFloat(item.tokenIn.amountUsd)) *
            100;
      const piRes = getPriceImpact(pi, 'Swap Price Impact', zapInfo?.zapDetails.suggestedSlippage || 100);

      return {
        tokenInSymbol: tokenIn?.symbol || '--',
        tokenOutSymbol: tokenOut?.symbol || '--',
        amountIn,
        amountOut,
        pool: `${dexName} Pool`,
        piRes,
      };
    }) || [];

  return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
};

export const getSwapPriceImpactFromActions = (swapActions: SwapAction[]) => {
  const invalidRes = swapActions.find(item => item.piRes.level === PI_LEVEL.INVALID);
  if (invalidRes) return invalidRes;

  const highRes = swapActions.find(item => item.piRes.level === PI_LEVEL.HIGH);
  if (highRes) return highRes;

  const veryHighRes = swapActions.find(item => item.piRes.level === PI_LEVEL.VERY_HIGH);
  if (veryHighRes) return veryHighRes;

  return { piRes: { level: PI_LEVEL.NORMAL, msg: '' } };
};

export const getSwapPriceImpactFromZapInfo = ({
  zapInfo,
  tokens,
  poolType,
  chainId,
}: {
  zapInfo: ZapRouteDetail;
  tokens: Token[];
  poolType: PoolType;
  chainId: ChainId;
}) => {
  const swapActions = parseSwapActions({ zapInfo, tokens, poolType, chainId });
  return getSwapPriceImpactFromActions(swapActions);
};
