import { useCallback, useEffect, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { ChainId, PoolType, Theme } from '@kyber/schema';

import Widget from '@/Widget';
import { ZapContextProvider } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useTokenStore } from '@/stores/useTokenStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { WidgetProps } from '@/types/index';

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
  } = useWidgetStore(
    useShallow(s => ({ theme: s.theme, setInitiaWidgetState: s.setInitiaWidgetState, reset: s.reset })),
  );
  const {
    pool,
    getPool,
    getPoolStat,
    reset: resetPoolStore,
  } = usePoolStore(useShallow(s => ({ pool: s.pool, getPool: s.getPool, getPoolStat: s.getPoolStat, reset: s.reset })));
  const {
    fetchImportedTokens,
    fetchTokens,
    reset: resetTokenStore,
  } = useTokenStore(
    useShallow(s => ({
      fetchImportedTokens: s.fetchImportedTokens,
      fetchTokens: s.fetchTokens,
      reset: s.reset,
    })),
  );
  const { getPosition, reset: resetPositionStore } = usePositionStore(
    useShallow(s => ({ getPosition: s.getPosition, reset: s.reset })),
  );

  const [firstFetch, setFirstFetch] = useState(false);

  const resetStore = useCallback(() => {
    resetPoolStore();
    resetTokenStore();
    resetPositionStore();
    resetWidgetStore();
  }, [resetPoolStore, resetTokenStore, resetPositionStore, resetWidgetStore]);

  useEffect(() => {
    return () => resetStore();
  }, [resetStore]);

  useEffect(() => {
    setInitiaWidgetState(widgetProps, resetStore);
  }, [widgetProps, setInitiaWidgetState, resetStore]);

  useEffect(() => {
    fetchImportedTokens();
  }, [fetchImportedTokens]);

  useEffect(() => {
    getPool({ poolAddress, chainId, poolType });
  }, [chainId, getPool, poolAddress, poolType]);

  useEffect(() => {
    getPoolStat({ poolAddress, chainId });
  }, [chainId, getPoolStat, poolAddress]);

  useEffect(() => {
    if (firstFetch || pool === 'loading' || !pool) return;

    fetchTokens({
      chainId,
      defaultAddresses: `${pool.token0.address},${pool.token1.address}`,
    });
    getPosition({
      positionId,
      chainId,
      poolType,
      connectedAccount,
      pool,
    });
    setFirstFetch(true);
  }, [chainId, connectedAccount, fetchTokens, firstFetch, getPosition, pool, poolType, positionId]);

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
