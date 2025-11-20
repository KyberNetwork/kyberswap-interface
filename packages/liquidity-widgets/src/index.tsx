import { useCallback, useEffect, useState } from 'react';

import { ChainId, PoolType, Theme } from '@kyber/schema';
import '@kyber/ui/styles.css';

import Widget from '@/Widget';
import '@/Widget.scss';
import '@/globals.css';
import { ZapContextProvider } from '@/hooks/useZapState';
import { SupportedLocale, WidgetI18nProvider } from '@/i18n';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { OnSuccessProps, TxStatus, WidgetMode, WidgetProps } from '@/types/index';

const LiquidityWidget = (widgetProps: WidgetProps) => {
  const {
    chainId,
    poolAddress,
    poolType,
    positionId,
    connectedAccount,
    locale,
    mode = WidgetMode.IN,
    createPoolConfig,
  } = widgetProps;

  const {
    theme,
    setInitiaWidgetState,
    reset: resetWidgetStore,
    setPositionId,
  } = useWidgetStore(['theme', 'setInitiaWidgetState', 'reset', 'setPositionId']);
  const {
    pool,
    getPool,
    reset: resetPoolStore,
    setCreatePool,
  } = usePoolStore(['pool', 'getPool', 'reset', 'setCreatePool']);

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
    if (mode === WidgetMode.CREATE) {
      if (createPoolConfig) setCreatePool(createPoolConfig, poolType);
      return;
    }
    if (!poolAddress) return;
    getPool({ poolAddress, chainId, poolType });
  }, [chainId, getPool, poolAddress, poolType, mode, createPoolConfig, setCreatePool]);

  useEffect(() => {
    if (mode === WidgetMode.CREATE) return;
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
  }, [chainId, connectedAccount, firstFetch, getPosition, pool, poolType, positionId, setPositionId, mode]);

  useEffect(() => {
    if (!theme) return;

    const root = document.querySelector<HTMLElement>(':root');
    Object.keys(theme).forEach(key => {
      root?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  return (
    <WidgetI18nProvider locale={locale}>
      <ZapContextProvider>
        <Widget />
      </ZapContextProvider>
    </WidgetI18nProvider>
  );
};

export { PoolType, ChainId, LiquidityWidget, TxStatus, WidgetMode };

export type { OnSuccessProps, SupportedLocale };
