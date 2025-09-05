import { useEffect } from 'react';

import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@kyber/schema';

import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';
import { getSlippageStorageKey } from '@/utils';

export default function useSlippageManager() {
  const { chainId, pool } = useZapOutContext(s => s);
  const { tokenOut, setSlippage, slippage } = useZapOutUserState();

  useEffect(() => {
    if (pool === 'loading' || slippage) return;

    if (pool.token0?.symbol && pool.token1?.symbol) {
      try {
        const storageKey = getSlippageStorageKey(pool.token0.symbol, pool.token1.symbol, chainId, pool.fee);
        const savedSlippage = localStorage.getItem(storageKey);
        if (savedSlippage) {
          const parsedSlippage = parseInt(savedSlippage, 10);
          if (!isNaN(parsedSlippage) && parsedSlippage > 0) {
            if (parsedSlippage !== slippage) {
              setSlippage(parsedSlippage);
              return;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load slippage from localStorage:', error);
      }
    }

    if (!tokenOut) return;

    if (pool.category === 'stablePair' && tokenOut.isStable) setSlippage(1);
    else if (
      pool.category === 'correlatedPair' &&
      [pool.token0.address.toLowerCase(), pool.token1.address.toLowerCase()].includes(
        tokenOut.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NETWORKS_INFO[chainId].wrappedToken.address.toLowerCase()
          : tokenOut.address.toLowerCase(),
      )
    )
      setSlippage(5);
    else setSlippage(10);
  }, [chainId, pool, setSlippage, slippage, tokenOut]);
}
