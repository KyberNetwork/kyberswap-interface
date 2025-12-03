import { useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { defaultToken } from '@kyber/schema';
import {
  StatusDialog,
  StatusDialogType,
  TOKEN_SELECT_MODE,
  TokenSelectorModal,
  translateFriendlyErrorMessage,
} from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

import Action from '@/components/Action';
import LiquidityToAdd, { LiquidityToAddSkeleton } from '@/components/Content/LiquidityToAdd';
import PriceInput from '@/components/Content/PriceInput';
import ZapSummary from '@/components/Content/ZapSummary';
import Estimated from '@/components/Estimated';
import Header from '@/components/Header';
import LeftWarning from '@/components/LeftWarning';
import Preview from '@/components/Preview';
import PriceControl from '@/components/PriceControl';
import PriceRange from '@/components/PriceRange';
import PriceSlider from '@/components/PriceSlider';
import Setting from '@/components/Setting';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { PriceType, ZapSnapshotState } from '@/types/index';

export default function Widget() {
  const { chainId, connectedAccount, onClose, onConnectWallet } = useWidgetStore([
    'chainId',
    'rpcUrl',
    'poolType',
    'connectedAccount',
    'onClose',
    'onConnectWallet',
  ]);
  const { pool, poolError } = usePoolStore(['pool', 'poolError']);

  const { tokensIn, amountsIn, setTokensIn, setAmountsIn, slippage, getZapRoute } = useZapState();

  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false);
  const [tokenAddressSelected, setTokenAddressSelected] = useState<string | undefined>();
  const [widgetError, setWidgetError] = useState<string | undefined>();
  const [zapSnapshotState, setZapSnapshotState] = useState<ZapSnapshotState | null>(null);

  const initializing = !pool;
  const { token0 = defaultToken, token1 = defaultToken } = !initializing ? pool : {};

  const onCloseTokenSelectModal = () => {
    setOpenTokenSelectModal(false);
    setTokenAddressSelected(undefined);
  };

  const onClosePreview = () => {
    setZapSnapshotState(null);
    getZapRoute();
  };

  const onCloseErrorDialog = () => {
    if (poolError) {
      onClose?.();
    } else {
      setWidgetError(undefined);
      getZapRoute();
    }
  };

  return (
    <div className="ks-lw ks-lw-style">
      {(poolError || widgetError) && (
        <StatusDialog
          type={StatusDialogType.ERROR}
          title={poolError ? t`Failed to load pool` : widgetError ? t`Failed to build zap route` : ''}
          description={translateFriendlyErrorMessage(poolError || widgetError || '')}
          onClose={onCloseErrorDialog}
          action={
            <button className="ks-outline-btn flex-1" onClick={onCloseErrorDialog}>
              {poolError ? <Trans>Close</Trans> : <Trans>Close & Refresh</Trans>}
            </button>
          }
        />
      )}
      {zapSnapshotState && !initializing && (
        <Preview zapState={zapSnapshotState} pool={pool} onDismiss={onClosePreview} />
      )}

      {openTokenSelectModal && (
        <TokenSelectorModal
          tokensIn={tokensIn}
          amountsIn={amountsIn}
          setTokensIn={setTokensIn}
          setAmountsIn={setAmountsIn}
          account={connectedAccount?.address}
          chainId={chainId}
          mode={tokenAddressSelected ? TOKEN_SELECT_MODE.SELECT : TOKEN_SELECT_MODE.ADD}
          selectedTokenAddress={tokenAddressSelected}
          onConnectWallet={onConnectWallet}
          onClose={onCloseTokenSelectModal}
          token0Address={token0.address}
          token1Address={token1.address}
          initialSlippage={slippage}
        />
      )}

      <div className={zapSnapshotState ? 'hidden' : 'p-6'}>
        <Header />
        <div className="mt-5 flex gap-5 max-sm:flex-col">
          <div className={cn('w-[55%] h-fit max-sm:w-full', 'px-4 py-4 border rounded-md border-stroke')}>
            <PriceControl />
            <PriceSlider />
            <PriceRange />
            <div className="flex gap-4 w-full">
              <PriceInput type={PriceType.MinPrice} />
              <PriceInput type={PriceType.MaxPrice} />
            </div>
            <LeftWarning />
          </div>

          <div className="w-[45%] max-sm:w-full">
            <div>
              <div className="text-base pl-1">
                <Trans>Add Liquidity</Trans>
              </div>
              {initializing || !tokensIn.length ? (
                <LiquidityToAddSkeleton />
              ) : (
                tokensIn.map((_, tokenIndex: number) => (
                  <LiquidityToAdd
                    tokenIndex={tokenIndex}
                    key={tokenIndex}
                    setOpenTokenSelectModal={setOpenTokenSelectModal}
                    setTokenAddressSelected={setTokenAddressSelected}
                  />
                ))
              )}
            </div>

            <div
              className="my-3 text-accent cursor-pointer w-fit text-sm"
              onClick={() => setOpenTokenSelectModal(true)}
            >
              <Trans>+ Add Token(s)</Trans>
            </div>

            <Estimated />
            <ZapSummary />
          </div>
        </div>
        <Action setWidgetError={setWidgetError} setZapSnapshotState={setZapSnapshotState} />
      </div>
      <Setting />
    </div>
  );
}
