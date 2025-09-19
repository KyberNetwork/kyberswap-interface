import { ChainId, PoolType, Theme } from '@kyber/schema';
import { StatusDialog, StatusDialogType } from '@kyber/ui';
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
import '@/index.css';
import '@/index.scss';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export { ChainId, PoolType };

export interface ZapMigrationProps {
  theme?: Theme;
  chainId: ChainId;
  className?: string;
  from: {
    poolType: PoolType;
    poolAddress: string;
    positionId: string;
  };
  to?: {
    poolType: PoolType;
    poolAddress: string;
    positionId?: string;
  };
  initialSlippage?: number;
  rePositionMode?: boolean;
  initialTick?: {
    tickLower: number;
    tickUpper: number;
  };
  connectedAccount: {
    address: string | undefined;
    chainId: number;
  };
  aggregatorOptions?: {
    includedSources?: string[];
    excludedSources?: string[];
  };
  feeConfig?: {
    feePcm: number;
    feeAddress: string;
  };
  client: string;
  referral?: string;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
  onBack?: () => void;
  onClose: () => void;
}

const createModalRoot = () => {
  let modalRoot = document.getElementById('ks-lw-migration-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'ks-lw-migration-modal-root';
    modalRoot.className = 'ks-lw-migration-style';
    document.body.appendChild(modalRoot);
  }
};

createModalRoot();

export const ZapMigration = (widgetProps: ZapMigrationProps) => {
  const {
    onClose: rawClose,
    className,
    onBack,
    initialTick,
    onSubmitTx,
    referral,
    onConnectWallet,
    onSwitchChain,
    connectedAccount,
    client,
    onViewPosition,
    rePositionMode,
    to,
  } = widgetProps;

  const { reset: resetWidgetStore } = useWidgetStore(['reset']);
  const { error: poolError, reset: resetPoolStore } = usePoolStore(['error', 'reset']);
  const { error: positionError, reset: resetPositionStore } = usePositionStore(['error', 'reset']);
  const { reset, showPreview } = useZapStore(['reset', 'showPreview']);

  useInitWidget(widgetProps);

  const onClose = () => {
    resetWidgetStore();
    resetPoolStore();
    resetPositionStore();
    reset();
    rawClose();
  };

  const onCloseErrorDialog = () => {
    if (poolError || positionError) onClose();
    // else {
    //   setWidgetError(undefined);
    //   getZapRoute();
    // }
  };

  const errorDialog =
    poolError || positionError ? (
      <StatusDialog
        type={StatusDialogType.ERROR}
        title={poolError ? 'Failed to load pool' : positionError ? 'Failed to load position' : ''}
        description={poolError || positionError}
        onClose={onCloseErrorDialog}
        action={
          <button className="ks-outline-btn flex-1" onClick={onCloseErrorDialog}>
            {poolError || positionError ? 'Close' : 'Close & Refresh'}
          </button>
        }
      />
    ) : null;

  return (
    <div className="ks-lw-migration-style" style={{ width: '100%', height: '100%' }}>
      {errorDialog}

      <div className={cn('bg-background text-text w-full h-full border rounded-md p-6 border-stroke', className)}>
        <Header onClose={onClose} onBack={onBack} />

        <div className="grid md:grid-cols-2 grid-cols-1 gap-4 md:gap-14 mt-4">
          <div className="flex flex-col gap-4">
            <PositionToMigrate />
            {rePositionMode && <PoolPriceWithRange type={RangeType.Source} />}
            <AmountToMigrate />
            {rePositionMode && <Estimated />}
            <div className="hidden md:block">
              <Warning />
            </div>
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
            {!rePositionMode && to?.positionId && <PoolPriceWithRange type={RangeType.Target} />}
            {!rePositionMode && <Estimated />}
            <div className="block md:hidden">
              <Warning />
            </div>
          </div>
        </div>

        <Action
          client={client}
          connectedAccount={connectedAccount}
          onConnectWallet={onConnectWallet}
          onSwitchChain={onSwitchChain}
          onClose={onClose}
          onBack={onBack}
          onSubmitTx={onSubmitTx}
        />

        {showPreview && (
          <Preview
            onSubmitTx={onSubmitTx}
            account={connectedAccount.address}
            client={client}
            onClose={onClose}
            onViewPosition={onViewPosition}
            referral={referral}
          />
        )}
      </div>
    </div>
  );
};
