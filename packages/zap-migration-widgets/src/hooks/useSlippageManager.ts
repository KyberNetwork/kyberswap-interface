import { useEffect } from 'react';

import { getSlippageStorageKey } from '@/constants';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function useSlippageManager({ initialSlippage }: { initialSlippage?: number }) {
  const { chainId } = useWidgetStore(['chainId']);
  const { sourcePool, targetPool } = usePoolStore(['sourcePool', 'targetPool']);
  const { setSlippage, slippage } = useZapStore(['setSlippage', 'slippage']);

  useEffect(() => {
    if (initialSlippage) {
      if (!slippage) setSlippage(initialSlippage);
      return;
    }

    if (!targetPool || slippage) return;

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

    if (!sourcePool) return;
    if (sourcePool.category === 'stablePair' && targetPool.category === 'stablePair') setSlippage(1);
    else if (
      sourcePool.category === 'correlatedPair' &&
      targetPool.category === 'correlatedPair' &&
      sourcePool.token0.address.toLowerCase() === targetPool.token0.address.toLowerCase() &&
      sourcePool.token1.address.toLowerCase() === targetPool.token1.address.toLowerCase()
    ) {
      setSlippage(5);
    } else setSlippage(10);
  }, [chainId, initialSlippage, setSlippage, slippage, sourcePool, targetPool]);
}
