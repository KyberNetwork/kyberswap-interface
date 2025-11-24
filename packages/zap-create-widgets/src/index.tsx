import { useCallback, useEffect } from 'react';

import { ChainId, PoolType, Theme } from '@kyber/schema';
import '@kyber/ui/styles.css';

import Widget from '@/Widget';
import '@/Widget.scss';
import '@/globals.css';
import { ZapContextProvider } from '@/hooks/useZapState';
import { SupportedLocale, WidgetI18nProvider } from '@/i18n';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { OnSuccessProps, TxStatus, WidgetProps } from '@/types/index';

const ZapCreateWidget = (widgetProps: WidgetProps) => {
  const { chainId, poolAddress, poolType, locale, createPoolConfig } = widgetProps;

  const {
    theme,
    setInitiaWidgetState,
    reset: resetWidgetStore,
  } = useWidgetStore(['theme', 'setInitiaWidgetState', 'reset']);
  const { getPool, reset: resetPoolStore, setCreatePool } = usePoolStore(['getPool', 'reset', 'setCreatePool']);

  const resetStore = useCallback(() => {
    resetPoolStore();
    resetWidgetStore();
  }, [resetPoolStore, resetWidgetStore]);

  useEffect(() => {
    return () => resetStore();
  }, [resetStore]);

  useEffect(() => {
    setInitiaWidgetState(widgetProps, resetStore);
  }, [widgetProps, setInitiaWidgetState, resetStore]);

  useEffect(() => {
    if (createPoolConfig) {
      setCreatePool(createPoolConfig, poolType);
      return;
    }
    if (!poolAddress) return;
    getPool({ poolAddress, chainId, poolType });
  }, [chainId, getPool, poolAddress, poolType, createPoolConfig, setCreatePool]);

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

export { PoolType, ChainId, ZapCreateWidget, TxStatus };

export type { OnSuccessProps, SupportedLocale };
