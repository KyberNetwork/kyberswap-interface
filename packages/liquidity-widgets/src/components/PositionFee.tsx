import { useEffect, useState } from 'react';

import { API_URLS, CHAIN_ID_TO_CHAIN, RemoveLiquidityAction, Token } from '@kyber/schema';
import { TokenLogo, TokenSymbol } from '@kyber/ui';
import { formatCurrency, formatTokenAmount } from '@kyber/utils/number';

import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export const PositionFee = () => {
  const { pool } = usePoolStore(['pool']);
  const { chainId, poolAddress, positionId, poolType } = useWidgetStore([
    'chainId',
    'poolAddress',
    'positionId',
    'poolType',
  ]);

  const [feeInfo, setFees] = useState<RemoveLiquidityAction | null>(null);
  useEffect(() => {
    fetch(
      `${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/out/route?dexFrom=${poolType}&poolFrom.id=${poolAddress}&positionFrom.id=${positionId}`,
    )
      .then(res => res.json())
      .then(res => {
        setFees(
          res?.data?.zapDetails?.actions?.find((item: any) => item.type === 'ACTION_TYPE_REMOVE_LIQUIDITY') || null,
        );
      });
  }, [poolAddress, positionId, poolType, chainId]);

  const { fees } = feeInfo?.removeLiquidity || {};
  if (!pool || !fees) return null;
  const poolTokens: Token[] = !pool ? [] : [pool.token0, pool.token1];

  const feeToken0 = poolTokens.find(item => item.address.toLowerCase() === fees?.[0]?.address.toLowerCase());
  const feeToken1 = poolTokens.find(item => item.address.toLowerCase() === fees?.[1]?.address.toLowerCase());

  const feeAmount0 = BigInt(fees?.[0]?.amount || 0);
  const feeAmount1 = BigInt(fees?.[1]?.amount || 0);

  const hasFee = feeAmount0 !== 0n || feeAmount1 !== 0n;
  if (!hasFee || !feeToken0 || !feeToken1) return null;

  return (
    <div className="px-4 py-3 mt-4 border border-stroke rounded-md">
      <p className="text-subText mb-4 text-sm">Your Position Fee</p>

      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <TokenLogo src={feeToken0?.logo} />
          <span>{formatTokenAmount(feeAmount0, feeToken0.decimals, 6)}</span>
          <TokenSymbol symbol={feeToken0.symbol} maxWidth={80} />
        </div>
        <p className="text-subText text-xs">{formatCurrency(+fees?.[0].amountUsd || 0)}</p>
      </div>

      <div className="flex justify-between mt-2">
        <div className="flex items-center gap-2">
          <TokenLogo src={feeToken1.logo} />
          <span>{formatTokenAmount(feeAmount1, feeToken1.decimals, 6)}</span>
          <TokenSymbol symbol={feeToken1.symbol} maxWidth={80} />
        </div>
        <p className="text-subText text-xs">{formatCurrency(+fees?.[1].amountUsd || 0)}</p>
      </div>
    </div>
  );
};
