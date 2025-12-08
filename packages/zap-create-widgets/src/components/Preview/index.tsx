import { useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { API_URLS, CHAIN_ID_TO_CHAIN, DEXES_INFO, NETWORKS_INFO, Pool } from '@kyber/schema';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  StatusDialog,
  StatusDialogType,
  translateFriendlyErrorMessage,
  translateZapMessage,
} from '@kyber/ui';
import { PI_LEVEL, friendlyError, parseZapInfo } from '@kyber/utils';
import { calculateGasMargin, estimateGas } from '@kyber/utils/crypto';
import { formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import Estimated from '@/components/Estimated';
import Head from '@/components/Preview/Head';
import PriceInfo from '@/components/Preview/PriceInfo';
import Warning from '@/components/Preview/Warning';
import ZapInAmount from '@/components/Preview/ZapInAmount';
import useOnSuccess from '@/components/Preview/useOnSuccess';
import useTxStatus from '@/components/Preview/useTxStatus';
import { useZapState } from '@/hooks/useZapState';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapSnapshotState } from '@/types/index';
import { parseTokensAndAmounts } from '@/utils';

export interface PreviewProps {
  zapState: ZapSnapshotState;
  pool: Pool;
  onDismiss: () => void;
}

export default function Preview(props: PreviewProps) {
  const {
    zapState: { zapInfo, deadline },
    pool,
    onDismiss,
  } = props;

  const { chainId, rpcUrl, poolType, connectedAccount, onSubmitTx, onViewPosition, source, onClose } = useWidgetStore([
    'chainId',
    'rpcUrl',
    'poolType',
    'connectedAccount',
    'onSubmitTx',
    'onViewPosition',
    'source',
    'onClose',
  ]);
  const { setSlippage, slippage, tokensIn, amountsIn } = useZapState();

  const [txHash, setTxHash] = useState('');
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const { txStatus } = useTxStatus({ txHash });

  const { token0, token1 } = pool;
  const { addedAmountInfo, zapImpact, suggestedSlippage } = parseZapInfo({
    zapInfo,
    token0,
    token1,
  });

  useOnSuccess({
    pool,
    txHash,
    txStatus,
    addedAmountInfo,
    zapInfo,
  });

  const handleClick = async () => {
    setAttempTx(true);
    setTxHash('');
    setTxError(null);

    const { address: account } = connectedAccount;

    const { tokensIn: validTokensIn, amountsIn: validAmountsIn } = parseTokensAndAmounts(tokensIn, amountsIn);
    const parsedTokensIn = validTokensIn.map((token, index) => ({
      symbol: token.symbol,
      logoUrl: token.logo,
      amount: formatDisplayNumber(validAmountsIn[index], {
        significantDigits: 6,
      }),
    }));

    fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/create/route/build`, {
      method: 'POST',
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
      }),
    })
      .then(res => res.json())
      .then(async res => {
        const { data } = res || {};
        if (data.callData && account) {
          const txData = {
            from: account,
            to: data.routerAddress,
            data: data.callData,
            value: `0x${BigInt(data.value).toString(16)}`,
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
          } catch (error) {
            setAttempTx(false);
            setTxError(error as Error);
          }
        }
      })
      .finally(() => {
        setAttempTx(false);
      });
  };

  if (attempTx || txHash || txError) {
    const dexName =
      typeof DEXES_INFO[poolType].name === 'string' ? DEXES_INFO[poolType].name : DEXES_INFO[poolType].name[chainId];
    const errorMessage = txError ? friendlyError(txError) || txError.message || JSON.stringify(txError) : '';
    const translatedErrorMessage = translateFriendlyErrorMessage(errorMessage);

    const handleSlippage = () => {
      if (slippage !== suggestedSlippage) setSlippage(suggestedSlippage);
      onDismiss();
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
          txStatus === 'success'
            ? t`You have successfully created your Pool.`
            : txStatus !== 'failed' && !txError && !txHash
              ? t`Confirm this transaction in your wallet - Zapping ${dexName} ${pool.token0.symbol}/${pool.token1.symbol} ${pool.fee}%`
              : undefined
        }
        errorMessage={txError ? translatedErrorMessage : undefined}
        transactionExplorerUrl={txHash ? `${NETWORKS_INFO[chainId].scanLink}/tx/${txHash}` : undefined}
        action={
          txStatus === 'success' ? (
            <>
              <button
                className="ks-outline-btn flex-1"
                onClick={() => {
                  onClose?.();
                  onDismiss();
                }}
              >
                <Trans>Close</Trans>
              </button>
              {onViewPosition ? (
                <button className="ks-primary-btn flex-1" onClick={() => onViewPosition(txHash)}>
                  <Trans>View position</Trans>
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                className="ks-outline-btn flex-1"
                onClick={() => {
                  onClose?.();
                  onDismiss();
                }}
              >
                <Trans>Close</Trans>
              </button>
              {errorMessage.includes('slippage') ? (
                <button className="ks-primary-btn flex-1" onClick={handleSlippage}>
                  {slippage !== suggestedSlippage ? t`Use Suggested Slippage` : t`Set Custom Slippage`}
                </button>
              ) : null}
            </>
          )
        }
        onClose={() => {
          if (txStatus === 'success') {
            onClose?.();
          }
          onDismiss();
        }}
      />
    );
  }

  return (
    <Dialog open={true} onOpenChange={onDismiss}>
      <DialogContent className="ks-lw-style max-h-[85vh] max-w-[480px] overflow-auto" aria-describedby={undefined}>
        <DialogTitle>
          <Trans>Create Pool with Zap</Trans>
        </DialogTitle>
        <div className="flex flex-col gap-4">
          <Head pool={pool} />

          <ZapInAmount />
          <PriceInfo pool={pool} />

          <Estimated isPreview={true} />

          <Warning
            zapInfo={zapInfo}
            slippage={slippage || 0}
            zapImpact={{ ...zapImpact, msg: translateZapMessage(zapImpact.msg) }}
          />
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
            <Trans>Create Pool with Zap</Trans>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
