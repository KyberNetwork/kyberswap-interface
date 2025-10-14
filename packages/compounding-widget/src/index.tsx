import { useCallback, useEffect, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { ChainId, PoolType } from '@kyber/schema';
import '@kyber/ui/styles.css';

import Widget from '@/Widget';
import { ZapContextProvider } from '@/hooks/useZapState';
import { WidgetI18nProvider } from '@/i18n';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { TxStatus, WidgetProps } from '@/types/index';

import './Widget.scss';
import './globals.css';

const createModalRoot = () => {
  let modalRoot = document.getElementById('ks-cw-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'ks-cw-modal-root';
    modalRoot.className = 'ks-cw-style';
    document.body.appendChild(modalRoot);
  }
};

createModalRoot();

const CompoundingWidget = (widgetProps: WidgetProps) => {
  const { chainId, poolAddress, poolType, positionId, connectedAccount, locale } = widgetProps;

  const {
    setInitiaWidgetState,
    reset: resetWidgetStore,
    setPositionId,
  } = useWidgetStore(
    useShallow(s => ({
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
      pool,
    });
    setPositionId(positionId);
    setFirstFetch(true);
  }, [chainId, connectedAccount, firstFetch, getPosition, pool, poolType, positionId, setPositionId]);

  return (
    <WidgetI18nProvider locale={locale}>
      <ZapContextProvider>
        <Widget />
      </ZapContextProvider>
    </WidgetI18nProvider>
  );
};

export { PoolType, ChainId, CompoundingWidget, TxStatus };
