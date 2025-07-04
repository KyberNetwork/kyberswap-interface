import { useMemo } from 'react';

import { divideBigIntToString, formatDisplayNumber } from '@kyber/utils/number';
import { tickToPrice } from '@kyber/utils/uniswapv3';

import SwitchIcon from '@/assets/svg/switch.svg';
import { MouseoverTooltip } from '@/components/Tooltip';
import { useZapState } from '@/hooks/useZapInState';
import { univ2PoolNormalize, univ3PoolNormalize } from '@/schema';
import { useWidgetContext } from '@/stores';
import { assertUnreachable } from '@/utils';

const shortenSymbol = (symbol: string, characterNumber: number = 8) =>
  symbol.length > characterNumber + 2 ? symbol.slice(0, characterNumber) + '...' : symbol;

export default function PriceInfo() {
  const { pool, theme, poolType } = useWidgetContext(s => s);
  const { marketPrice, revertPrice, toggleRevertPrice } = useZapState();

  const loading = pool === 'loading';

  const price = useMemo(() => {
    if (pool === 'loading') return '--';
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    if (success) {
      return formatDisplayNumber(tickToPrice(data.tick, data.token0?.decimals, data.token1?.decimals, revertPrice), {
        significantDigits: 6,
      });
    }

    const { success: isUniV2, data: uniV2Pool } = univ2PoolNormalize.safeParse(pool);

    if (isUniV2) {
      const p = divideBigIntToString(
        BigInt(uniV2Pool.reserves[1]) * 10n ** BigInt(uniV2Pool.token0?.decimals),
        BigInt(uniV2Pool.reserves[0]) * 10n ** BigInt(uniV2Pool.token1?.decimals),
        18,
      );
      return formatDisplayNumber(revertPrice ? 1 / +p : p, {
        significantDigits: 6,
      });
    }
    return assertUnreachable(poolType as never, 'poolType is not handled');
  }, [pool, poolType, revertPrice]);

  const isDeviated = useMemo(
    () => !!marketPrice && Math.abs(marketPrice / (revertPrice ? 1 / +price : +price) - 1) > 0.02,
    [marketPrice, price, revertPrice],
  );

  const marketRate = useMemo(
    () =>
      marketPrice
        ? formatDisplayNumber(revertPrice ? 1 / marketPrice : marketPrice, {
            significantDigits: 6,
          })
        : null,
    [marketPrice, revertPrice],
  );

  if (loading) return <div className="rounded-md border border-stroke py-3 px-4">Loading...</div>;

  const firstToken = revertPrice ? pool?.token1 : pool?.token0;
  const secondToken = revertPrice ? pool?.token0 : pool?.token1;

  const firstTokenShortenSymbol = shortenSymbol(firstToken?.symbol || '');
  const secondTokenShortenSymbol = shortenSymbol(secondToken?.symbol || '');

  return (
    <>
      <div className="rounded-md border border-stroke py-3 px-4 mt-[6px]">
        <div className="flex items-center justify-start gap-1 text-subText text-sm flex-wrap">
          <span>Pool price</span>
          <span className="font-medium text-text">{price}</span>

          <MouseoverTooltip
            text={secondTokenShortenSymbol !== secondToken?.symbol ? secondToken?.symbol : ''}
            placement="top"
          >
            {secondTokenShortenSymbol}
          </MouseoverTooltip>
          <span>per</span>
          <MouseoverTooltip
            text={firstTokenShortenSymbol !== firstToken?.symbol ? firstToken?.symbol : ''}
            placement="top"
          >
            {firstTokenShortenSymbol}
          </MouseoverTooltip>
          <SwitchIcon className="cursor-pointer" onClick={() => toggleRevertPrice()} role="button" />
        </div>
      </div>

      {marketPrice === null && (
        <div
          className="py-3 px-4 text-subText text-sm rounded-md mt-2 font-normal"
          style={{ backgroundColor: `${theme.warning}33` }}
        >
          <span className="italic text-text">Unable to get the market price. Please be cautious!</span>
        </div>
      )}

      {isDeviated && (
        <div
          className="py-3 px-4 text-subText text-sm rounded-md mt-2 font-normal"
          style={{ backgroundColor: `${theme.warning}33` }}
        >
          <div className="italic text-text">
            The pool's current price of{' '}
            <span className="font-medium text-warning not-italic">
              1 {secondToken.symbol} = {price} {firstToken.symbol}
            </span>{' '}
            deviates from the market price{' '}
            <span className="font-medium text-warning not-italic">
              (1 {secondToken.symbol} = {marketRate} {firstToken.symbol})
            </span>
            . You might have high impermanent loss after you add liquidity to this pool
          </div>
        </div>
      )}
    </>
  );
}
