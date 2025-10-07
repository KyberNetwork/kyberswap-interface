import { univ2Types } from '@kyber/schema';
import { TokenLogo, TokenSymbol } from '@kyber/ui';
import { formatDisplayNumber, formatTokenAmount } from '@kyber/utils/number';

import RevertPriceIcon from '@/assets/icons/ic_revert_price.svg';
import PriceRange from '@/components/PoolPriceWithRange/PriceRange';
import usePriceRange from '@/components/RangeInput/usePriceRange';
import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function UpdatedPosition() {
  const { rePositionMode } = useWidgetStore(['rePositionMode']);
  const { targetPool, targetPoolPrice, revertPrice, toggleRevertPrice } = usePoolStore([
    'targetPool',
    'targetPoolPrice',
    'revertPrice',
    'toggleRevertPrice',
  ]);
  const { addedLiquidity } = useZapRoute();
  const { minPrice, maxPrice, isMinTick, isMaxTick } = usePriceRange();

  if (!targetPool) return null;

  const currentPrice = targetPoolPrice || 0;
  const isTargetUniV2 = univ2Types.includes(targetPool.poolType as any);
  const isOutRange = isTargetUniV2 ? false : currentPrice < +(minPrice || 0) || currentPrice > +(maxPrice || 0);

  return (
    <div className="rounded-md px-5 py-4 bg-interactive">
      <div className="flex items-center justify-between">
        <span className="text-subText text-sm">Updated position</span>
        <span>
          {formatDisplayNumber(addedLiquidity.addedValue0 + addedLiquidity.addedValue1, {
            style: 'currency',
            significantDigits: 6,
          })}
        </span>
      </div>
      <div className="flex items-center text-base mt-2 gap-1.5">
        <TokenLogo src={targetPool.token0.logo} size={20} alt={targetPool.token0.symbol} />
        <div className="flex items-center gap-1">
          {formatTokenAmount(addedLiquidity.addedAmount0, targetPool.token0.decimals, 8)}
          <TokenSymbol symbol={targetPool.token0.symbol} maxWidth={80} />
        </div>
        <div className="text-subText">
          ~{formatDisplayNumber(addedLiquidity.addedValue0, { style: 'currency', significantDigits: 6 })}
        </div>
      </div>

      <div className="flex items-center text-base mt-1 gap-1.5">
        <TokenLogo src={targetPool.token1.logo} size={20} alt={targetPool.token1.symbol} />
        <div className="flex items-center gap-1">
          {formatTokenAmount(addedLiquidity.addedAmount1, targetPool.token1.decimals, 10)}
          <TokenSymbol symbol={targetPool.token1.symbol} maxWidth={80} />
        </div>
        <div className="text-subText">
          ~{formatDisplayNumber(addedLiquidity.addedValue1, { style: 'currency', significantDigits: 6 })}
        </div>
      </div>

      {rePositionMode ? (
        <>
          <div className="w-full h-[1px] bg-stroke my-3" />

          <div className="flex items-center justify-between flex-wrap gap-2 row-gap-0">
            <p className="text-subText text-sm">Current price</p>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                1{' '}
                {revertPrice ? (
                  <TokenSymbol symbol={targetPool.token1.symbol} maxWidth={80} />
                ) : (
                  <TokenSymbol symbol={targetPool.token0.symbol} maxWidth={80} />
                )}{' '}
                = {formatDisplayNumber(currentPrice, { significantDigits: 8 })}{' '}
                {revertPrice ? (
                  <TokenSymbol symbol={targetPool.token0.symbol} maxWidth={80} />
                ) : (
                  <TokenSymbol symbol={targetPool.token1.symbol} maxWidth={80} />
                )}
              </div>
              <div
                className="flex items-center justify-center rounded-full bg-[#ffffff14] w-6 h-6"
                onClick={toggleRevertPrice}
              >
                <RevertPriceIcon className="cursor-pointer" role="button" />
              </div>
            </div>
          </div>
          <div className="pt-10 pb-2">
            <PriceRange
              currentPrice={currentPrice}
              minPrice={+(minPrice || 0)}
              maxPrice={+(maxPrice || 0)}
              isMinTick={isMinTick}
              isMaxTick={isMaxTick}
              isOutRange={isOutRange}
              isUniV2={isTargetUniV2}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
