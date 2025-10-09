import { useState } from 'react';

import { DEXES_INFO, NETWORKS_INFO } from '@kyber/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  StatusDialog,
  StatusDialogType,
} from '@kyber/ui';
import { friendlyError } from '@kyber/utils';
import { calculateGasMargin, estimateGas } from '@kyber/utils/crypto';
import { formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import CircleChevronDown from '@/assets/icons/circle-chevron-down.svg';
import Estimated from '@/components/Preview/Estimated';
import { MigrationSummary } from '@/components/Preview/MigrationSummary';
import PreviewPoolInfo from '@/components/Preview/PreviewPoolInfo';
import UpdatedPosition from '@/components/Preview/UpdatedPosition';
import Warning from '@/components/Preview/Warning';
import useTxStatus from '@/hooks/useTxStatus';
import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export function Preview({
  onSubmitTx,
  onClose,
  onViewPosition,
  onExplorePools,
}: {
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?: {
      sourcePool: string;
      sourceDexLogo: string;
      destinationPool: string;
      destinationDexLogo: string;
    },
  ) => Promise<string>;
  onClose: () => void;
  onViewPosition?: (txHash: string) => void;
  onExplorePools?: () => void;
}) {
  const { chainId, rpcUrl, connectedAccount, rePositionMode } = useWidgetStore([
    'chainId',
    'rpcUrl',
    'connectedAccount',
    'rePositionMode',
  ]);
  const { route, slippage, setSlippage, buildData, setBuildData } = useZapStore([
    'route',
    'slippage',
    'setSlippage',
    'buildData',
    'setBuildData',
  ]);
  const { sourcePool, targetPool } = usePoolStore(['sourcePool', 'targetPool']);
  const { targetPositionId } = usePositionStore(['targetPositionId']);

  const account = connectedAccount.address;
  const { suggestedSlippage } = useZapRoute();

  const [showProcessing, setShowProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | undefined>();
  const { txStatus } = useTxStatus({ txHash: txHash || undefined });

  if (route === null || !sourcePool || !targetPool || !account || !buildData) return null;

  const handleSlippage = () => {
    if (slippage !== suggestedSlippage) setSlippage(suggestedSlippage);
    setBuildData(undefined);
  };

  const onDismiss = () => {
    setBuildData(undefined);
    setShowProcessing(false);
    setError(undefined);
  };

  const handleConfirm = async () => {
    if (!buildData) {
      setShowProcessing(true);
      return;
    }

    const txData = {
      from: account,
      to: buildData.routerAddress,
      value: '0x0', // alway use WETH when remove this this is alway 0
      data: buildData.callData,
    };

    setShowProcessing(true);
    const gas = await estimateGas(rpcUrl, txData).catch(err => {
      console.log(err.message);
      setError(err);
      return 0n;
    });

    if (gas === 0n) return;

    try {
      const txHash = await onSubmitTx(
        {
          ...txData,
          gasLimit: calculateGasMargin(gas),
        },
        {
          sourcePool: `${sourcePool.token0.symbol}/${sourcePool.token1.symbol}`,
          sourceDexLogo: DEXES_INFO[sourcePool.poolType].icon,
          destinationPool: `${targetPool.token0.symbol}/${targetPool.token1.symbol}`,
          destinationDexLogo: DEXES_INFO[targetPool.poolType].icon,
        },
      );
      setTxHash(txHash);
    } catch (err) {
      setError(err as Error);
    }
  };

  if (showProcessing) {
    const errorMessage = error ? friendlyError(error) || error.message || JSON.stringify(error) : '';

    return (
      <StatusDialog
        className="z-[1003]"
        overlayClassName="z-[1003]"
        type={
          txStatus === 'success'
            ? StatusDialogType.SUCCESS
            : txStatus === 'failed' || error
              ? StatusDialogType.ERROR
              : txHash
                ? StatusDialogType.PROCESSING
                : StatusDialogType.WAITING
        }
        title={txStatus === 'success' && rePositionMode ? 'Reposition Completed' : undefined}
        description={
          txStatus !== 'success' && txStatus !== 'failed' && !error && !txHash
            ? 'Confirm this transaction in your wallet'
            : txStatus === 'success'
              ? 'You have successfully migrated your liquidity'
              : undefined
        }
        errorMessage={error ? errorMessage : undefined}
        transactionExplorerUrl={txHash ? `${NETWORKS_INFO[chainId].scanLink}/tx/${txHash}` : undefined}
        action={
          <>
            {txStatus === 'success' && onExplorePools && rePositionMode ? (
              <button className="ks-outline-btn flex-1" onClick={onExplorePools}>
                Explore pools
              </button>
            ) : (
              <button className="ks-outline-btn flex-1" onClick={onDismiss}>
                Close
              </button>
            )}
            {txStatus === 'success' ? (
              onViewPosition && txHash ? (
                <button className="ks-primary-btn flex-1" onClick={() => onViewPosition(txHash)}>
                  View position
                </button>
              ) : null
            ) : errorMessage.includes('slippage') ? (
              <button className="ks-primary-btn flex-1" onClick={handleSlippage}>
                {slippage !== suggestedSlippage ? 'Use Suggested Slippage' : 'Set Custom Slippage'}
              </button>
            ) : null}
          </>
        }
        onClose={() => {
          if (txStatus === 'success') onClose();
          onDismiss();
        }}
      />
    );
  }

  return (
    <Dialog open={true} onOpenChange={onDismiss}>
      <DialogPortal>
        <DialogContent
          className="max-h-[800px] max-w-[450px] overflow-auto z-[1002]"
          overlayClassName="z-[1002]"
          aria-describedby={undefined}
          containerClassName="ks-lw-migration-style"
        >
          <DialogHeader>
            <DialogTitle>
              {rePositionMode
                ? 'Reposition'
                : targetPositionId
                  ? 'Migrate to increase position liquidity'
                  : 'Migrate liquidity via Zap'}
            </DialogTitle>
          </DialogHeader>

          <div>
            <div className="flex justify-between items-center">
              <p>{rePositionMode ? 'Reposition liquidity' : 'Migrated liquidity'}</p>
              <p>
                {formatDisplayNumber(route.zapDetails.initialAmountUsd, {
                  style: 'currency',
                })}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <PreviewPoolInfo pool={sourcePool} chainId={chainId} />

              {rePositionMode ? null : (
                <>
                  <div className="w-full flex justify-center">
                    <CircleChevronDown className="text-stroke w-5 h-5" />
                  </div>
                  <PreviewPoolInfo pool={targetPool} chainId={chainId} />
                </>
              )}
            </div>

            <div className="mt-5">
              <UpdatedPosition />
            </div>

            <Estimated />
            <Warning />

            <div className="flex gap-5 mt-8 mb-4">
              <button
                className="flex-1 h-[40px] rounded-full border border-stroke text-subText text-sm font-medium"
                onClick={onDismiss}
              >
                Cancel
              </button>
              <button
                className={cn(
                  'flex-1 h-[40px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium',
                  'disabled:bg-stroke disabled:text-subText disabled:border-stroke disabled:cursor-not-allowed',
                )}
                onClick={handleConfirm}
              >
                {rePositionMode ? 'Confirm' : 'Confirm migration'}
              </button>
            </div>

            <MigrationSummary />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
