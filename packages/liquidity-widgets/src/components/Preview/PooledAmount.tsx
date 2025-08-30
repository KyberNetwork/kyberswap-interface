import { Pool } from '@kyber/schema';
import { TokenLogo } from '@kyber/ui';
import { formatCurrency, formatDisplayNumber } from '@kyber/utils/number';

import { useWidgetStore } from '@/stores/useWidgetStore';

export default function PooledAmount({
  pool,
  positionAmountInfo,
  addedAmountInfo,
}: {
  pool: Pool;
  positionAmountInfo: { amount0: number; amount1: number; positionAmount0Usd: number; positionAmount1Usd: number };
  addedAmountInfo: { addedAmount0: number; addedAmount1: number; addedAmount0Usd: number; addedAmount1Usd: number };
}) {
  const { positionId } = useWidgetStore(['positionId']);

  return (
    <div className="flex justify-between gap-4 w-full items-start">
      <div className="text-sm font-medium text-subText">Est. Pooled Amount</div>
      <div className="text-[14px] flex gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {pool?.token0?.logo && (
              <TokenLogo src={pool.token0.logo} className={`relative ${positionId ? '' : 'mt-1 -top-1'}`} />
            )}
            <div>
              {formatDisplayNumber(
                positionId !== undefined ? positionAmountInfo.amount0 : addedAmountInfo.addedAmount0,
                {
                  significantDigits: 4,
                },
              )}{' '}
              {pool?.token0.symbol}
            </div>
          </div>

          {positionId && (
            <div className="text-end">
              + {formatDisplayNumber(addedAmountInfo.addedAmount0, { significantDigits: 4 })} {pool?.token0.symbol}
            </div>
          )}
          <div className="ml-auto w-fit text-subText">
            ~{formatCurrency(addedAmountInfo.addedAmount0Usd + positionAmountInfo.positionAmount0Usd)}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {pool?.token1?.logo && (
              <TokenLogo src={pool.token1.logo} className={`relative ${positionId ? '' : 'mt-1 -top-1'}`} />
            )}
            <div>
              {formatDisplayNumber(
                positionId !== undefined ? positionAmountInfo.amount1 : addedAmountInfo.addedAmount1,
                {
                  significantDigits: 4,
                },
              )}{' '}
              {pool?.token1.symbol}
            </div>
          </div>
          {positionId && (
            <div className="text-end">
              + {formatDisplayNumber(addedAmountInfo.addedAmount1, { significantDigits: 4 })} {pool?.token1.symbol}
            </div>
          )}
          <div className="ml-auto w-fit text-subText">
            ~{formatCurrency(addedAmountInfo.addedAmount1Usd + positionAmountInfo.positionAmount1Usd)}
          </div>
        </div>
      </div>
    </div>
  );
}
