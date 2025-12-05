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
  const { poolType, locale, createPoolConfig } = widgetProps;

  const {
    theme,
    setInitiaWidgetState,
    reset: resetWidgetStore,
  } = useWidgetStore(['theme', 'setInitiaWidgetState', 'reset']);
  const { reset: resetPoolStore, setCreatePool } = usePoolStore(['reset', 'setCreatePool']);

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
    setCreatePool(createPoolConfig, poolType);
  }, [createPoolConfig, poolType, setCreatePool]);

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
