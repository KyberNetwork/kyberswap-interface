import {
  AddLiquidityAction,
  PartnerFeeAction,
  Position,
  ProtocolFeeAction,
  RefundAction,
  Token,
  ZapAction,
  ZapRouteDetail,
} from '@kyber/schema';

import { formatUnits } from '../crypto';
import { formatDisplayNumber, toRawString } from '../number';
import { PI_LEVEL, getZapImpact } from './price-impact';

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
