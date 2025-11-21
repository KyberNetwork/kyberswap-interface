import { Trans } from '@lingui/macro';

import { TokenLogo, TokenSymbol } from '@kyber/ui';
import { formatCurrency, formatDisplayNumber, formatTokenAmount } from '@kyber/utils/number';

import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function PooledAmount() {
  const { pool } = usePoolStore(['pool']);
  const { positionId } = useWidgetStore(['positionId']);
  const { position } = usePositionStore(['position']);
  const { addedLiquidity } = useZapRoute();

  return (
    <div className="flex justify-between gap-4 w-full items-start">
      <div className="text-sm font-medium text-subText">
        <Trans>Est. Pooled Amount</Trans>
      </div>
      <div className="text-[14px] flex gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {pool?.token0?.logo && (
              <TokenLogo src={pool.token0.logo} className={`relative ${positionId ? '' : 'mt-1 -top-1'}`} />
            )}
            <div className="flex items-center gap-1">
              {formatDisplayNumber(
                formatTokenAmount(
                  position ? position.amount0 : addedLiquidity.addedAmount0,
                  pool?.token0.decimals || 18,
                ),
                {
                  significantDigits: 4,
                },
              )}{' '}
              <TokenSymbol symbol={pool?.token0.symbol || ''} maxWidth={60} />
            </div>
          </div>

          {positionId && (
            <div className="text-end">
              +{' '}
              {formatDisplayNumber(formatTokenAmount(addedLiquidity.addedAmount0, pool?.token0.decimals || 18), {
                significantDigits: 4,
              })}{' '}
              <TokenSymbol symbol={pool?.token0.symbol || ''} maxWidth={60} />
            </div>
          )}
          <div className="ml-auto w-fit text-subText">
            ~
            {formatCurrency(
              addedLiquidity.addedValue0 +
                (position
                  ? +formatTokenAmount(position.amount0, pool?.token0.decimals || 18) * (pool?.token0.price || 0)
                  : 0),
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {pool?.token1?.logo && (
              <TokenLogo src={pool.token1.logo} className={`relative ${positionId ? '' : 'mt-1 -top-1'}`} />
            )}
            <div className="flex items-center gap-1">
              {formatDisplayNumber(
                formatTokenAmount(
                  position ? position.amount1 : addedLiquidity.addedAmount1,
                  pool?.token1.decimals || 18,
                ),
                {
                  significantDigits: 4,
                },
              )}{' '}
              <TokenSymbol symbol={pool?.token1.symbol || ''} maxWidth={60} />
            </div>
          </div>
          {positionId && (
            <div className="text-end">
              +{' '}
              {formatDisplayNumber(formatTokenAmount(addedLiquidity.addedAmount1, pool?.token1.decimals || 18), {
                significantDigits: 4,
              })}{' '}
              <TokenSymbol symbol={pool?.token1.symbol || ''} maxWidth={60} />
            </div>
          )}
          <div className="ml-auto w-fit text-subText">
            ~
            {formatCurrency(
              addedLiquidity.addedValue1 +
                (position
                  ? +formatTokenAmount(position.amount1, pool?.token1.decimals || 18) * (pool?.token1.price || 0)
                  : 0),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
