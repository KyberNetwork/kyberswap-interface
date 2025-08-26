import { useShallow } from 'zustand/shallow';

import { defaultToken } from '@kyber/schema';
import { MouseoverTooltip, Skeleton } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';

import RevertPriceIcon from '@/assets/svg/ic_revert_price.svg';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

const shortenSymbol = (symbol: string, characterNumber = 8) =>
  symbol.length > characterNumber + 2 ? symbol.slice(0, characterNumber) + '...' : symbol;

export default function PriceInfo() {
  const theme = useWidgetStore(s => s.theme);
  const { pool, poolPrice, revertPrice, toggleRevertPrice } = usePoolStore(
    useShallow(s => ({
      pool: s.pool,
      poolPrice: s.poolPrice,
      revertPrice: s.revertPrice,
      toggleRevertPrice: s.toggleRevertPrice,
    })),
  );

  const initializing = pool === 'loading';

  const token0 = initializing ? defaultToken : revertPrice ? pool.token1 : pool.token0;
  const token1 = initializing ? defaultToken : revertPrice ? pool.token0 : pool.token1;

  const firstTokenShortenSymbol = shortenSymbol(token0.symbol);
  const secondTokenShortenSymbol = shortenSymbol(token1.symbol);

  return (
    <>
      <div className="rounded-md border border-stroke py-3 px-4 mt-[6px]">
        <div className="flex justify-between">
          <div className="flex items-center justify-start gap-1 text-sm flex-wrap">
            <span className="text-subText">Current price</span>
            {initializing ? (
              <Skeleton className="w-20 h-5" />
            ) : (
              <>
                <span>1</span>
                <MouseoverTooltip text={firstTokenShortenSymbol !== token0.symbol ? token0.symbol : ''} placement="top">
                  {firstTokenShortenSymbol}
                </MouseoverTooltip>
                <span>=</span>
                <span>{formatDisplayNumber(poolPrice, { significantDigits: 8 })}</span>

                <MouseoverTooltip
                  text={secondTokenShortenSymbol !== token1.symbol ? token1.symbol : ''}
                  placement="top"
                >
                  {secondTokenShortenSymbol}
                </MouseoverTooltip>
              </>
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

      {poolPrice === null && !initializing && (
        <div
          className="py-3 px-4 text-subText text-sm rounded-md mt-2 font-normal"
          style={{ backgroundColor: `${theme.warning}33` }}
        >
          <span className="italic text-text">Unable to get the market price. Please be cautious!</span>
        </div>
      )}
    </>
  );
}
