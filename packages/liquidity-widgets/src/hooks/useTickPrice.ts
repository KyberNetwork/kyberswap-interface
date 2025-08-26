import { useEffect, useMemo, useState } from 'react';

import { useDebounce } from '@kyber/hooks';
import { Position, Token, univ3Position } from '@kyber/schema';
import { formatNumber } from '@kyber/utils/number';
import { tickToPrice } from '@kyber/utils/uniswapv3';

export default function useTickPrice({
  token0,
  token1,
  revertPrice,
  initialTick,
  position,
}: {
  token0?: Token;
  token1?: Token;
  revertPrice: boolean;
  initialTick?: { tickLower: number; tickUpper: number };
  position: 'loading' | Position | null;
}) {
  const [tickLower, setTickLower] = useState<number | null>(null);
  const [tickUpper, setTickUpper] = useState<number | null>(null);

  const debounceTickLower = useDebounce(tickLower, 300);
  const debounceTickUpper = useDebounce(tickUpper, 300);

  const priceLower = useMemo(() => {
    if (!token0 || !token1 || tickLower == null) return null;
    return formatNumber(+tickToPrice(tickLower, token0.decimals, token1.decimals, revertPrice), 8);
  }, [token0, token1, tickLower, revertPrice]);

  const priceUpper = useMemo(() => {
    if (!token0 || !token1 || tickUpper === null) return null;
    return formatNumber(+tickToPrice(tickUpper, token0.decimals, token1.decimals, revertPrice), 8);
  }, [token0, token1, tickUpper, revertPrice]);

  // set tick if position exists
  useEffect(() => {
    if (position) {
      const { success: isUniV3Position, data } = univ3Position.safeParse(position);

      if (isUniV3Position && data.tickUpper !== undefined && data.tickLower !== undefined) {
        setTickLower(data.tickLower);
        setTickUpper(data.tickUpper);
      }
    }
  }, [position]);

  useEffect(() => {
    if (initialTick && !tickLower && !tickUpper) {
      setTickLower(initialTick.tickLower);
      setTickUpper(initialTick.tickUpper);
    }
  }, [initialTick, tickLower, tickUpper]);

  return {
    tickLower,
    tickUpper,
    setTickLower,
    setTickUpper,
    debounceTickLower,
    debounceTickUpper,
    priceLower,
    priceUpper,
  };
}
