import { useEffect } from 'react';

import { getSlippageStorageKey } from '@/constants';
import { ChainId } from '@/schema';
import { usePoolsStore } from '@/stores/usePoolsStore';
import { useZapStateStore } from '@/stores/useZapStateStore';

export default function useSlippageManager({
  chainId,
  initialSlippage,
}: {
  chainId: ChainId;
  initialSlippage?: number;
}) {
  const { pools } = usePoolsStore();
  const { setSlippage, slippage } = useZapStateStore();

  useEffect(() => {
    if (initialSlippage) {
      if (!slippage) setSlippage(initialSlippage);
      return;
    }

    if (pools === 'loading' || slippage) return;
    const targetPool = pools[1];

    // First, try to load from localStorage
    if (targetPool.token0?.symbol && targetPool.token1?.symbol) {
      try {
        const storageKey = getSlippageStorageKey(
          targetPool.token0.symbol,
          targetPool.token1.symbol,
          chainId,
          targetPool.fee,
        );
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

    const sourcePool = pools[0];
    if (sourcePool.category === 'stablePair' && targetPool.category === 'stablePair') setSlippage(1);
    else if (
      sourcePool.category === 'correlatedPair' &&
      targetPool.category === 'correlatedPair' &&
      sourcePool.token0.address.toLowerCase() === targetPool.token0.address.toLowerCase() &&
      sourcePool.token1.address.toLowerCase() === targetPool.token1.address.toLowerCase()
    ) {
      setSlippage(5);
    } else setSlippage(10);
  }, [pools, slippage, initialSlippage, setSlippage, chainId]);
}
