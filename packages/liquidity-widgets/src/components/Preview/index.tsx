import { useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { DEXES_INFO, NETWORKS_INFO, univ2Types, univ3PoolNormalize } from '@kyber/schema';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  StatusDialog,
  StatusDialogType,
  translateFriendlyErrorMessage,
} from '@kyber/ui';
import { PI_LEVEL, friendlyError } from '@kyber/utils';
import { calculateGasMargin, estimateGas } from '@kyber/utils/crypto';
import { getTokenIdFromTxHash } from '@kyber/utils/crypto/transaction';
import { formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import Estimated from '@/components/Estimated';
import Head from '@/components/Preview/Head';
import PriceInfo from '@/components/Preview/PriceInfo';
import Warning from '@/components/Preview/Warning';
import ZapInAmount from '@/components/Preview/ZapInAmount';
import useOnSuccess from '@/components/Preview/useOnSuccess';
import useTxStatus from '@/components/Preview/useTxStatus';
import useZapRoute from '@/hooks/useZapRoute';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { parseTokensAndAmounts } from '@/utils';

export default function Preview({ onDismiss }: { onDismiss: () => void }) {
  const {
    chainId,
    rpcUrl,
    poolType,
    connectedAccount,
    onSubmitTx,
    onViewPosition,
    positionId,
    onClose,
    onSetUpSmartExit,
  } = useWidgetStore([
    'chainId',
    'rpcUrl',
    'poolType',
    'connectedAccount',
    'onSubmitTx',
    'onViewPosition',
    'positionId',
    'onClose',
    'onSetUpSmartExit',
  ]);
  const { pool } = usePoolStore(['pool']);
  const { setSlippage, slippage, tokensIn, amountsIn, buildData } = useZapState();
  const { zapImpact, suggestedSlippage } = useZapRoute();

  const [txHash, setTxHash] = useState('');
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const [loadingPosition, setLoadingPosition] = useState(false);
  const { txStatus } = useTxStatus({ txHash });

  const { success: isUniV3 } = univ3PoolNormalize.safeParse(pool);

  useOnSuccess({
    txHash,
    txStatus,
  });

  const handleClick = async () => {
    if (!buildData || !pool) return;
    setAttempTx(true);
    setTxHash('');
    setTxError(null);

    const { address: account } = connectedAccount;
    if (!account) return;

    const { tokensIn: validTokensIn, amountsIn: validAmountsIn } = parseTokensAndAmounts(tokensIn, amountsIn);
    const parsedTokensIn = validTokensIn.map((token, index) => ({
      symbol: token.symbol,
      logoUrl: token.logo,
      amount: formatDisplayNumber(validAmountsIn[index], {
        significantDigits: 6,
      }),
    }));

    const txData = {
      from: account,
      to: buildData.routerAddress,
      data: buildData.callData,
      value: `0x${BigInt(buildData.value).toString(16)}`,
    };

    try {
      const gasEstimation = await estimateGas(rpcUrl, txData);
      const txHash = await onSubmitTx(
        {
          ...txData,
          gasLimit: calculateGasMargin(gasEstimation),
        },
        {
          tokensIn: parsedTokensIn,
          pool: `${pool.token0.symbol}/${pool.token1.symbol}`,
          dexLogo: DEXES_INFO[poolType].icon,
        },
      );
      setTxHash(txHash);
    } catch (e) {
      setAttempTx(false);
      setTxError(e as Error);
    } finally {
      setAttempTx(false);
    }
  };

  const onWrappedDismiss = () => {
    onDismiss();
    setTxHash('');
    setTxError(null);
    setAttempTx(false);
    setLoadingPosition(false);
  };

  const handleSetUpSmartExit = async () => {
    if (!txHash || !onSetUpSmartExit) return;

    // UniV2 doesn't support smart exit
    const isUniV2 = univ2Types.includes(poolType as any);
    if (isUniV2) {
      onSetUpSmartExit(undefined);
      return;
    }

    setLoadingPosition(true);
    try {
      const tokenId = await getTokenIdFromTxHash({ rpcUrl, txHash, poolType });
      if (tokenId) {
        onSetUpSmartExit({ tokenId, chainId, poolType });
      } else {
        onSetUpSmartExit(undefined);
      }
    } catch (error) {
      console.error('Error getting tokenId for smart exit:', error);
      onSetUpSmartExit(undefined);
    } finally {
      setLoadingPosition(false);
    }
  };

  if (!buildData || !pool) return null;

  if (attempTx || txHash || txError) {
    const dexName =
      typeof DEXES_INFO[poolType].name === 'string' ? DEXES_INFO[poolType].name : DEXES_INFO[poolType].name[chainId];
    const errorMessage = txError ? friendlyError(txError) || txError.message || JSON.stringify(txError) : '';
    const translatedErrorMessage = translateFriendlyErrorMessage(errorMessage);

    const handleSlippage = () => {
      if (slippage !== suggestedSlippage) setSlippage(suggestedSlippage);
      onWrappedDismiss();
    };

    return (
      <StatusDialog
        type={
          txStatus === 'success'
            ? StatusDialogType.SUCCESS
            : txStatus === 'failed' || txError
              ? StatusDialogType.ERROR
              : txHash
                ? StatusDialogType.PROCESSING
                : StatusDialogType.WAITING
        }
        description={
          txStatus !== 'success' && txStatus !== 'failed' && !txError && !txHash
            ? t`Confirm this transaction in your wallet - Zapping` +
              ' ' +
              (positionId && isUniV3
                ? t`Position #${positionId}`
                : t`${dexName} ${pool.token0.symbol}/${pool.token1.symbol} ${pool.fee}%`)
            : undefined
        }
        subDescription={
          onSetUpSmartExit ? (
            <Trans>
              Set up the <b>Smart Exit</b> to auto-remove your position based on price, time, or earnings conditions.
            </Trans>
          ) : undefined
        }
        errorMessage={txError ? translatedErrorMessage : undefined}
        transactionExplorerUrl={txHash ? `${NETWORKS_INFO[chainId].scanLink}/tx/${txHash}` : undefined}
        action={
          <>
            <button
              className="ks-outline-btn flex-1"
              onClick={() => {
                if (txStatus === 'success') {
                  if (onViewPosition && onSetUpSmartExit) onViewPosition(txHash);
                  else if (onClose) onClose();
                }
                onWrappedDismiss();
              }}
            >
              {txStatus === 'success' && onViewPosition && onSetUpSmartExit ? (
                <Trans>View position</Trans>
              ) : (
                <Trans>Close</Trans>
              )}
            </button>
            {txStatus === 'success' ? (
              onViewPosition && !onSetUpSmartExit ? (
                <button className="ks-primary-btn flex-1" onClick={() => onViewPosition(txHash)}>
                  <Trans>View position</Trans>
                </button>
              ) : onSetUpSmartExit ? (
                <button className="ks-primary-btn flex-1" onClick={handleSetUpSmartExit} disabled={loadingPosition}>
                  {loadingPosition ? <Trans>Loading position...</Trans> : <Trans>Set up smart exit</Trans>}
                </button>
              ) : null
            ) : errorMessage.includes('slippage') ? (
              <button className="ks-primary-btn flex-1" onClick={handleSlippage}>
                {slippage !== suggestedSlippage ? t`Use Suggested Slippage` : t`Set Custom Slippage`}
              </button>
            ) : null}
          </>
        }
        onClose={onWrappedDismiss}
      />
    );
  }

  return (
    <Dialog open={true} onOpenChange={onWrappedDismiss}>
      <DialogContent className="ks-lw-style max-h-[85vh] max-w-[480px] overflow-auto" aria-describedby={undefined}>
        <DialogTitle>
          {positionId ? <Trans>Increase Liquidity via Zap</Trans> : <Trans>Add Liquidity via Zap</Trans>}
        </DialogTitle>
        <div className="flex flex-col gap-4">
          <Head />

          <ZapInAmount />
          <PriceInfo />

          <Estimated isPreview={true} />

          <Warning />
        </div>
        <DialogFooter>
          <button
            className={cn(
              'ks-primary-btn mt-4 w-full',
              zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                ? 'bg-error border-error text-white'
                : zapImpact.level === PI_LEVEL.HIGH
                  ? 'bg-warning border-warning'
                  : '',
            )}
            onClick={handleClick}
          >
            {positionId ? <Trans>Increase liquidity</Trans> : <Trans>Add liquidity</Trans>}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
