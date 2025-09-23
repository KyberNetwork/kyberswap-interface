import { useEffect, useState } from 'react';

import { ChainId, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, POOL_CATEGORY, Pool, Token } from '@kyber/schema';

import { getSlippageStorageKey } from '@/constants';

export default function useSlippageManager({
  pool,
  tokensIn,
  chainId,
}: {
  pool: 'loading' | Pool;
  tokensIn: Token[];
  chainId: ChainId;
}) {
  const [slippage, setSlippage] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (pool === 'loading' || slippage || !tokensIn.length) return;

    // First, try to load from localStorage
    if (pool.token0?.symbol && pool.token1?.symbol) {
      try {
        const storageKey = getSlippageStorageKey(pool.token0.symbol, pool.token1.symbol, chainId, pool.fee);
        const savedSlippage = localStorage.getItem(storageKey);
        if (savedSlippage) {
          const parsedSlippage = parseInt(savedSlippage, 10);
          if (!isNaN(parsedSlippage) && parsedSlippage > 0) {
            // Only set if it's different from current slippage
            if (parsedSlippage !== slippage) {
              setSlippage(parsedSlippage);
              return; // Exit early if we loaded from localStorage
            }
          }
        }
      } catch (error) {
        // Silently handle localStorage errors
        console.warn('Failed to load slippage from localStorage:', error);
      }
    }

    const isTokensStable = tokensIn.every(tk => tk.isStable);

    const isTokensInPair = tokensIn.every(tk => {
      const addr =
        tk.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NETWORKS_INFO[chainId].wrappedToken.address.toLowerCase()
          : tk.address.toLowerCase();

      return pool.token0.address.toLowerCase() === addr || pool.token1.address.toLowerCase() === addr;
    });

    if (pool.category === POOL_CATEGORY.STABLE_PAIR && isTokensStable) setSlippage(1);
    else if (pool.category === POOL_CATEGORY.CORRELATED_PAIR && isTokensInPair) setSlippage(5);
    else setSlippage(10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, tokensIn]);

  return { slippage, setSlippage };
}
