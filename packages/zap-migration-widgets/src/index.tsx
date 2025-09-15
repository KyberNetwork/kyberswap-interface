import { useEffect } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kyber/ui';
import '@kyber/ui/styles.css';
import { fetchTokenPrice } from '@kyber/utils';
import { cn } from '@kyber/utils/tailwind-helpers';

import CircleChevronRight from '@/assets/icons/circle-chevron-right.svg';
import { Action } from '@/components/Action';
import { FromPool } from '@/components/FromPool';
import { Header } from '@/components/Header';
import { PoolInfo } from '@/components/PoolInfo';
import { Preview } from '@/components/Preview';
import { SourcePoolState } from '@/components/SourcePoolState';
import { TargetPoolState } from '@/components/TargetPoolState';
import { ToPool } from '@/components/ToPool';
import useSlippageManager from '@/hooks/useSlippageManager';
import { ChainId, Dex, DexFrom, DexTo } from '@/schema';
import { usePoolsStore } from '@/stores/usePoolsStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useZapStateStore } from '@/stores/useZapStateStore';
import { Theme, defaultTheme } from '@/theme';

import './index.css';
import './index.scss';

export { Dex, ChainId };

export interface ZapMigrationProps {
  theme?: Theme;
  chainId: ChainId;
  className?: string;
  from: DexFrom;
  to: DexTo;
  aggregatorOptions?: {
    includedSources?: string[];
    excludedSources?: string[];
  };
  feeConfig?: {
    feePcm: number;
    feeAddress: string;
  };
  onClose: () => void;
  client: string;
  connectedAccount: {
    address: string | undefined; // check if account is connected
    chainId: number; // check if wrong network
  };
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
  onBack?: () => void;
  initialTick?: {
    tickLower: number;
    tickUpper: number;
  };
  referral?: string;
  initialSlippage?: number;
}

// createModalRoot.js
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

export const ZapMigration = (props: ZapMigrationProps) => {
  const {
    client,
    className,
    chainId,
    from,
    to,
    onClose: rawClose,
    connectedAccount,
    onConnectWallet,
    onSwitchChain,
    onSubmitTx,
    theme,
    onViewPosition,
    onBack,
    initialTick,
    referral,
    initialSlippage,
    //aggregatorOptions,
    //feeConfig,
  } = props;

  const { getPools, error: poolError, setTheme, pools, reset: resetPools } = usePoolsStore();
  const { reset } = useZapStateStore();
  const { reset: resetPos, toPosition } = usePositionStore();

  const onClose = () => {
    resetPos();
    resetPools();
    reset();
    rawClose();
  };

  const { fetchPosition, error: posError, setToPositionNull } = usePositionStore();

  const { showPreview } = useZapStateStore();
  useSlippageManager({ chainId, initialSlippage });

  useEffect(() => {
    if (!theme) return;
    const themeToApply = {
      ...defaultTheme,
      ...theme,
    };
    setTheme(themeToApply);
    const r = document.querySelector<HTMLElement>(':root');
    Object.keys(themeToApply).forEach(key => {
      r?.style.setProperty(`--ks-lw-${key}`, themeToApply[key as keyof Theme]);
    });
  }, [setTheme, theme]);

  // fetch pool on load
  useEffect(() => {
    resetPos();
    resetPools();
    reset();

    fetchPosition(from.dex, chainId, from.positionId, from.poolId, true);
    if (to.positionId) fetchPosition(to.dex, chainId, to.positionId, to.poolId, false);
    else setToPositionNull();

    const params = {
      chainId,
      poolFrom: from.poolId,
      poolTo: to.poolId,
      dexFrom: from.dex,
      dexTo: to.dex,
      fetchPrices: fetchTokenPrice,
    };
    getPools(params);

    // refresh pools every 10s
    const interval = setInterval(() => {
      getPools(params);
      fetchPosition(from.dex, chainId, from.positionId, from.poolId, true);
    }, 15_000);

    return () => clearInterval(interval);
  }, [chainId, from.poolId, to.poolId, from.dex, to.dex, getPools]);

  return (
    <div className="ks-lw-migration-style" style={{ width: '100%', height: '100%' }}>
      <Dialog onOpenChange={onClose} open={Boolean(poolError || posError)}>
        <DialogContent containerClassName="ks-lw-migration-style">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription className="text-red-500 mt-4">{poolError || posError}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          'bg-background w-full h-full max-w-[800px] border rounded-md p-6 border-stroke',
          'text-text',
          className,
        )}
      >
        <Header onClose={onClose} onBack={onBack} chainId={chainId} />

        <div className="flex gap-3 items-center mt-5">
          <FromPool />
          <div className="hidden md:block">
            <CircleChevronRight className="text-primary w-8 h-8 p-1" />
          </div>
          <ToPool className="hidden md:block" />
        </div>

        <div className="flex flex-col md:!flex-row gap-4 md:!gap-12 mt-4">
          <SourcePoolState />

          <div className="block md:!hidden">
            <CircleChevronRight className="text-primary w-8 h-8 p-1 rotate-90 mx-auto mb-4" />
            <PoolInfo pool={pools === 'loading' ? 'loading' : pools[1]} chainId={chainId} position={toPosition} />
          </div>

          <ToPool className="block md:!hidden" />

          <TargetPoolState initialTick={initialTick} chainId={chainId} />
        </div>

        <Action
          client={client}
          chainId={chainId}
          connectedAccount={connectedAccount}
          onConnectWallet={onConnectWallet}
          onSwitchChain={onSwitchChain}
          onClose={onClose}
          onBack={onBack}
          onSubmitTx={onSubmitTx}
        />

        {showPreview && (
          <Preview
            chainId={chainId}
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
