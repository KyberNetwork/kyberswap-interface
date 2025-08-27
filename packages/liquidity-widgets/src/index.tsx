import { useCallback, useEffect, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { ChainId, PoolType, Theme } from '@kyber/schema';
import '@kyber/ui/styles.css';

import Widget from '@/Widget';
import { ZapContextProvider } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { OnSuccessProps, WidgetProps } from '@/types/index';

import './Widget.scss';
import './globals.css';

const createModalRoot = () => {
  let modalRoot = document.getElementById('ks-lw-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'ks-lw-modal-root';
    modalRoot.className = 'ks-lw-style';
    document.body.appendChild(modalRoot);
  }
};

createModalRoot();

const LiquidityWidget = (widgetProps: WidgetProps) => {
  const { chainId, poolAddress, poolType, positionId, connectedAccount } = widgetProps;

  const {
    theme,
    setInitiaWidgetState,
    reset: resetWidgetStore,
    setPositionId,
  } = useWidgetStore(
    useShallow(s => ({
      theme: s.theme,
      setInitiaWidgetState: s.setInitiaWidgetState,
      reset: s.reset,
      setPositionId: s.setPositionId,
    })),
  );
  const {
    pool,
    getPool,
    reset: resetPoolStore,
  } = usePoolStore(useShallow(s => ({ pool: s.pool, getPool: s.getPool, reset: s.reset })));

  const { getPosition, reset: resetPositionStore } = usePositionStore(
    useShallow(s => ({ getPosition: s.getPosition, reset: s.reset })),
  );

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
    if (firstFetch || pool === 'loading' || !pool) return;

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

export { PoolType, ChainId, LiquidityWidget };

export type { OnSuccessProps };
