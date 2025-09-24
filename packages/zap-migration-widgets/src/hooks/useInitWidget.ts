import { useEffect, useState } from 'react';

import { Theme } from '@kyber/schema';

import useSlippageManager from '@/hooks/useSlippageManager';
import { ZapMigrationProps } from '@/index';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function useInitWidget(widgetProps: ZapMigrationProps) {
  const {
    chainId,
    from,
    to,
    theme: themeProps,
    rePositionMode,
    initialSlippage,
    connectedAccount,
    client,
    referral,
  } = widgetProps;

  const [hasReseted, setHasReseted] = useState(false);

  const {
    theme,
    setInitiaWidgetState,
    reset: resetWidgetStore,
  } = useWidgetStore(['theme', 'setInitiaWidgetState', 'reset']);
  const {
    sourcePool,
    targetPool,
    getPools,
    reset: resetPoolStore,
  } = usePoolStore(['sourcePool', 'targetPool', 'getPools', 'reset']);
  const {
    getSourcePositions,
    getTargetPosition,
    reset: resetPositionStore,
    setSourcePositionId,
    setTargetPositionId,
  } = usePositionStore([
    'getSourcePositions',
    'getTargetPosition',
    'reset',
    'setSourcePositionId',
    'setTargetPositionId',
  ]);
  const { reset: resetZapStore } = useZapStore(['reset']);

  useEffect(() => {
    if (hasReseted) return;
    resetWidgetStore();
    resetPoolStore();
    resetPositionStore();
    resetZapStore();
    setHasReseted(true);
  }, [hasReseted, resetWidgetStore, resetPoolStore, resetPositionStore, resetZapStore]);

  useEffect(() => {
    if (!theme) return;

    const root = document.querySelector<HTMLElement>(':root');
    Object.keys(theme).forEach(key => {
      root?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  useEffect(() => {
    if (!hasReseted) return;
    setInitiaWidgetState({
      theme: themeProps as Theme,
      chainId,
      rePositionMode,
      sourcePoolType: from.poolType,
      targetPoolType: to?.poolType || from.poolType,
      connectedAccount,
      client,
      referral,
    });
  }, [
    themeProps,
    chainId,
    setInitiaWidgetState,
    hasReseted,
    rePositionMode,
    from.poolType,
    to?.poolType,
    connectedAccount,
    client,
    referral,
  ]);

  useEffect(() => {
    if (!hasReseted) return;
    getPools({ chainId, source: from, target: to, rePositionMode });

    const getPoolsInterval = setInterval(() => {
      getPools({ chainId, source: from, target: to, rePositionMode });
    }, 15_000);

    return () => clearInterval(getPoolsInterval);
  }, [chainId, getPools, from, to, rePositionMode, hasReseted]);

  useEffect(() => {
    if (!hasReseted) return;

    setSourcePositionId(from.positionId);
    if (to?.positionId) setTargetPositionId(to.positionId);
  }, [from.positionId, hasReseted, setSourcePositionId, setTargetPositionId, to?.positionId]);

  useEffect(() => {
    if (!sourcePool) return;
    if (!hasReseted) return;

    getSourcePositions({ chainId, positionId: from.positionId, pool: sourcePool });
  }, [chainId, getSourcePositions, from.positionId, sourcePool, hasReseted]);

  useEffect(() => {
    if (!to || !to.positionId || !targetPool) return;
    if (!hasReseted) return;

    getTargetPosition({ chainId, positionId: to.positionId, pool: targetPool });
  }, [chainId, getTargetPosition, targetPool, to, hasReseted]);

  useSlippageManager({ initialSlippage });
}
