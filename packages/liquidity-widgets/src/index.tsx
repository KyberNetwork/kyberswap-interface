import { useCallback, useEffect, useState } from 'react';

import { ChainId, PoolType, Theme } from '@kyber/schema';
import '@kyber/ui/styles.css';

import Widget from '@/Widget';
import '@/Widget.scss';
import '@/globals.css';
import { ZapContextProvider } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { OnSuccessProps, WidgetProps, ZapStatus } from '@/types/index';

const LiquidityWidget = (widgetProps: WidgetProps) => {
  const { chainId, poolAddress, poolType, positionId, connectedAccount } = widgetProps;

  const {
    theme,
    setInitiaWidgetState,
    reset: resetWidgetStore,
    setPositionId,
  } = useWidgetStore(['theme', 'setInitiaWidgetState', 'reset', 'setPositionId']);
  const { pool, getPool, reset: resetPoolStore } = usePoolStore(['pool', 'getPool', 'reset']);

  const { getPosition, reset: resetPositionStore } = usePositionStore(['getPosition', 'reset']);

  const [firstFetch, setFirstFetch] = useState(false);

  const resetStore = useCallback(() => {
    resetPoolStore();
    resetPositionStore();
    resetWidgetStore();
  }, [resetPoolStore, resetPositionStore, resetWidgetStore]);

  useEffect(() => {
    return () => resetStore();
  }, [resetStore]);

  useEffect(() => {
    setInitiaWidgetState(widgetProps, resetStore);
  }, [widgetProps, setInitiaWidgetState, resetStore]);

  useEffect(() => {
    getPool({ poolAddress, chainId, poolType });
  }, [chainId, getPool, poolAddress, poolType]);

  useEffect(() => {
    if (firstFetch || !pool) return;

    getPosition({
      positionId,
      chainId,
      poolType,
      connectedAccount,
      pool,
      setPositionId,
    });
    if (positionId) setPositionId(positionId);
    setFirstFetch(true);
  }, [chainId, connectedAccount, firstFetch, getPosition, pool, poolType, positionId, setPositionId]);

  useEffect(() => {
    if (!theme) return;

    const root = document.querySelector<HTMLElement>(':root');
    Object.keys(theme).forEach(key => {
      root?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  return (
    <ZapContextProvider>
      <Widget />
    </ZapContextProvider>
  );
};

export { PoolType, ChainId, LiquidityWidget, ZapStatus };

export type { OnSuccessProps };
