import { useEffect, useMemo, useState } from 'react';

import { Trans } from '@lingui/macro';

import { useTokenPrices } from '@kyber/hooks';
import { defaultToken } from '@kyber/schema';
import { Skeleton, TokenSymbol } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';

import RevertPriceIcon from '@/assets/svg/ic_revert_price.svg';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

const formatInputValue = (value: number | null) => {
  if (!Number.isFinite(value) || value === null) return '';
  return formatDisplayNumber(value, { significantDigits: 8 }).replace(/,/g, '');
};

const getNumericPrice = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'price' in (value as { price?: number })) {
    return (value as { price?: number }).price;
  }
  return undefined;
};

const PriceControl = () => {
  const { pool, poolPrice, revertPrice, toggleRevertPrice, setPoolPrice } = usePoolStore([
    'pool',
    'poolPrice',
    'revertPrice',
    'toggleRevertPrice',
    'setPoolPrice',
  ]);
  const { chainId } = useWidgetStore(['chainId']);

  const [inputValue, setInputValue] = useState('');

  const tokenAddresses = useMemo(() => {
    if (!pool) return [];
    return [pool.token0.address.toLowerCase(), pool.token1.address.toLowerCase()];
  }, [pool]);

  const { prices, loading } = useTokenPrices({
    addresses: tokenAddresses,
    chainId,
  });

  const token0Address = tokenAddresses[0];
  const token1Address = tokenAddresses[1];
  const token0Price = getNumericPrice(token0Address ? prices[token0Address] : undefined);
  const token1Price = getNumericPrice(token1Address ? prices[token1Address] : undefined);

  const baseToken = pool ? (revertPrice ? pool.token1 : pool.token0) : defaultToken;
  const quoteToken = pool ? (revertPrice ? pool.token0 : pool.token1) : defaultToken;

  const marketPrice = useMemo(() => {
    if (!token0Price || !token1Price) return null;
    if (token0Price <= 0 || token1Price <= 0) return null;
    const ratio = revertPrice ? token1Price / token0Price : token0Price / token1Price;
    if (!Number.isFinite(ratio) || ratio <= 0) return null;
    return ratio;
  }, [token0Price, token1Price, revertPrice]);

  useEffect(() => {
    if (marketPrice && poolPrice === null) {
      setPoolPrice(marketPrice);
    }
  }, [marketPrice, poolPrice, setPoolPrice]);

  useEffect(() => {
    setInputValue(formatInputValue(poolPrice));
  }, [poolPrice]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const normalized = rawValue.replace(/,/g, '.');
    const parsed = Number(normalized);

    if (normalized === '' || normalized === '.') {
      setPoolPrice(parsed);
      return;
    }

    if (/^\d*\.?\d*$/.test(normalized)) {
      setPoolPrice(parsed);
    }
  };

  const handleUseMarketRate = () => {
    setPoolPrice(marketPrice);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-base">
        <Trans>Set the initiate pool price</Trans>
      </p>

      <div className="flex justify-between">
        <div className="flex items-center justify-start gap-3 text-sm flex-wrap">
          <span className="text-subText uppercase">
            <Trans>Market rate</Trans>
          </span>
          {loading ? (
            <Skeleton className="w-20 h-5" />
          ) : (
            <div className="flex gap-1">
              <span>1</span>
              <TokenSymbol symbol={baseToken.symbol} maxWidth={100} />
              <span>=</span>
              <span>{formatDisplayNumber(marketPrice, { significantDigits: 8 })}</span>

              <TokenSymbol symbol={quoteToken.symbol} maxWidth={100} />
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-center rounded-full bg-[#ffffff14] w-6 h-6"
          onClick={toggleRevertPrice}
        >
          <RevertPriceIcon className="cursor-pointer" role="button" />
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 border border-stroke rounded-md">
        <input
          className="flex-1 bg-transparent text-base text-text outline-none placeholder:text-subText"
          value={inputValue}
          onChange={handleInputChange}
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          placeholder="0.0"
        />
        <button
          type="button"
          className="ks-secondary-btn h-6 py-0 px-3 text-xs"
          onClick={handleUseMarketRate}
          disabled={!marketPrice}
        >
          <Trans>Use Market Rate</Trans>
        </button>
      </div>
    </div>
  );
};

export default PriceControl;
