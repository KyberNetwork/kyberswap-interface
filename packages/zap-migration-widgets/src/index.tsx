import { useEffect } from 'react';

import { t } from '@lingui/macro';

import { useDebounce } from '@kyber/hooks';
import { ChainId, PoolType, ZERO_ADDRESS } from '@kyber/schema';
import { StatusDialog, StatusDialogType, translateFriendlyErrorMessage } from '@kyber/ui';
import '@kyber/ui/styles.css';
import { cn } from '@kyber/utils/tailwind-helpers';

import ArrowRight from '@/assets/icons/ic_right_arrow.svg';
import { Action } from '@/components/Action';
import AmountToMigrate from '@/components/AmountToMigrate';
import { Estimated } from '@/components/Estimated';
import { Header } from '@/components/Header';
import { PoolInfo, PoolInfoType } from '@/components/PoolInfo';
import PoolPriceWithRange, { RangeType } from '@/components/PoolPriceWithRange';
import PositionToMigrate from '@/components/PositionToMigrate';
import { Preview } from '@/components/Preview';
import RangeInput from '@/components/RangeInput';
import TargetPosition from '@/components/TargetPosition';
import Warning from '@/components/Warning';
import useInitWidget from '@/hooks/useInitWidget';
import { WidgetI18nProvider } from '@/i18n';
import '@/index.css';
import '@/index.scss';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';
import { TxStatus, ZapMigrationProps } from '@/types/index';

export { ChainId, PoolType, TxStatus, type ZapMigrationProps };
export type { SupportedLocale } from '@/i18n';

export const ZapMigration = (widgetProps: ZapMigrationProps) => {
  const {
    onClose: rawClose,
    className,
    onBack,
    initialTick,
    onSubmitTx,
    onConnectWallet,
    onSwitchChain,
    connectedAccount,
    client,
    onViewPosition,
    rePositionMode,
    to,
    chainId,
    onExplorePools,
    locale,
  } = widgetProps;

  const {
    reset: resetWidgetStore,
    widgetError,
    setWidgetError,
  } = useWidgetStore(['reset', 'widgetError', 'setWidgetError']);
  const {
    sourcePool,
    targetPool,
    error: poolError,
    reset: resetPoolStore,
  } = usePoolStore(['sourcePool', 'targetPool', 'error', 'reset']);
  const {
    sourcePosition,
    targetPosition,
    targetPositionId,
    error: positionError,
    reset: resetPositionStore,
  } = usePositionStore(['sourcePosition', 'targetPosition', 'targetPositionId', 'error', 'reset']);
  const { reset, buildData, fetchZapRoute, liquidityOut, tickUpper, tickLower } = useZapStore([
    'reset',
    'buildData',
    'fetchZapRoute',
    'liquidityOut',
    'tickUpper',
    'tickLower',
  ]);

  useInitWidget(widgetProps);

  const debounceLiquidityOut = useDebounce(liquidityOut, 500);
  const debouncedTickUpper = useDebounce(tickUpper, 500);
  const debouncedTickLower = useDebounce(tickLower, 500);

  useEffect(() => {
    if (buildData) return;
    fetchZapRoute(chainId, client, connectedAccount?.address || ZERO_ADDRESS);
  }, [
    sourcePool,
    targetPool,
    sourcePosition,
    targetPosition,
    fetchZapRoute,
    debouncedTickUpper,
    debouncedTickLower,
    debounceLiquidityOut,
    buildData,
    connectedAccount?.address,
    chainId,
    client,
  ]);

  const onClose = () => {
    resetWidgetStore();
    resetPoolStore();
    resetPositionStore();
    reset();
    rawClose();
  };

  const onCloseErrorDialog = () => {
    if (poolError || positionError) onClose();
    else {
      setWidgetError('');
      fetchZapRoute(chainId, client, connectedAccount?.address || ZERO_ADDRESS);
    }
  };

  const errorDialog =
    poolError || positionError || widgetError ? (
      <StatusDialog
        className="z-[1003]"
        overlayClassName="z-[1003]"
        type={StatusDialogType.ERROR}
        title={
          poolError
            ? t`Failed to load pool`
            : positionError
              ? t`Failed to load position`
              : widgetError
                ? t`Failed to load zap route`
                : ''
        }
        description={translateFriendlyErrorMessage(poolError || positionError || widgetError)}
        onClose={onCloseErrorDialog}
        action={
          <button className="ks-outline-btn flex-1" onClick={onCloseErrorDialog}>
            {poolError || positionError ? t`Close` : t`Close & Refresh`}
          </button>
        }
      />
    ) : null;

  return (
    <WidgetI18nProvider locale={locale}>
      <div className="ks-lw-migration-style" style={{ width: '100%', height: '100%' }}>
        {errorDialog}

        <div
          className={cn(
            'bg-background text-text w-full h-full border rounded-md p-6 border-stroke',
            className,
            buildData && 'hidden',
          )}
        >
          <Header onClose={onClose} onBack={onBack} />

          <div className="grid md:grid-cols-2 grid-cols-1 gap-4 md:gap-14 mt-4">
            <div className="flex flex-col gap-4">
              <PositionToMigrate />
              {rePositionMode && <PoolPriceWithRange type={RangeType.Source} />}
              <AmountToMigrate />
              {!targetPositionId && <Estimated />}
            </div>

            <div className="block md:hidden rotate-90 w-fit mx-auto">
              <ArrowRight className="text-primary w-6 h-6" />
            </div>

            <div className="flex flex-col gap-4">
              <div className="block md:hidden mb-4">
                <PoolInfo type={PoolInfoType.Target} />
              </div>
              <TargetPosition />
              <RangeInput initialTick={initialTick} />
              {!rePositionMode && to?.positionId && <PoolPriceWithRange type={RangeType.Target} showPrice />}
              {targetPositionId && <Estimated />}
              <Warning />
            </div>
          </div>

          <Action onConnectWallet={onConnectWallet} onSwitchChain={onSwitchChain} onClose={onClose} onBack={onBack} />
        </div>

        {buildData && (
          <Preview onSubmitTx={onSubmitTx} onViewPosition={onViewPosition} onExplorePools={onExplorePools} />
        )}
      </div>
    </WidgetI18nProvider>
  );
};
