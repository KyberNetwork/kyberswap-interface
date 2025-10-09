import { useState } from 'react';

import { API_URLS, CHAIN_ID_TO_CHAIN, DEXES_INFO, NETWORKS_INFO, Pool, univ3PoolNormalize } from '@kyber/schema';
import { InfoHelper, StatusDialog, StatusDialogType, TokenSymbol } from '@kyber/ui';
import { parseZapInfo } from '@kyber/utils';
import { friendlyError } from '@kyber/utils';
import { PI_LEVEL } from '@kyber/utils';
import { calculateGasMargin, estimateGas } from '@kyber/utils/crypto';
import { formatCurrency, formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import X from '@/assets/svg/x.svg';
import EstimatedRow from '@/components/Estimated/EstimatedRow';
import Head from '@/components/Preview/Head';
import PooledAmount from '@/components/Preview/PooledAmount';
import PriceInfo from '@/components/Preview/PriceInfo';
import Warning from '@/components/Preview/Warning';
import ZapInAmount from '@/components/Preview/ZapInAmount';
import useOnSuccess from '@/components/Preview/useOnSuccess';
import useTxStatus from '@/components/Preview/useTxStatus';
import { SlippageWarning } from '@/components/SlippageWarning';
import { useZapState } from '@/hooks/useZapState';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapSnapshotState } from '@/types/index';
import { parseTokensAndAmounts } from '@/utils';

export interface PreviewProps {
  zapState: ZapSnapshotState;
  pool: Pool;
  onDismiss: () => void;
}

export default function Preview({ zapState: { zapInfo, deadline, gasUsd }, pool, onDismiss }: PreviewProps) {
  const {
    chainId,
    rpcUrl,
    poolType,
    connectedAccount,
    onSubmitTx,
    onViewPosition,
    referral,
    source,
    positionId,
    onClose,
  } = useWidgetStore([
    'chainId',
    'rpcUrl',
    'poolType',
    'connectedAccount',
    'onSubmitTx',
    'onViewPosition',
    'referral',
    'source',
    'positionId',
    'onClose',
  ]);
  const { position } = usePositionStore(['position']);
  const { setSlippage, slippage, tokensIn, amountsIn } = useZapState();

  const [txHash, setTxHash] = useState('');
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const { txStatus } = useTxStatus({ txHash });

  const { success: isUniV3 } = univ3PoolNormalize.safeParse(pool);

  const { token0, token1 } = pool;
  const { refundInfo, addedAmountInfo, feeInfo, positionAmountInfo, zapImpact, suggestedSlippage } = parseZapInfo({
    zapInfo,
    token0,
    token1,
    position,
  });

  useOnSuccess({
    pool,
    txHash,
    txStatus,
    positionAmountInfo,
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
      amount: validAmountsIn[index],
    }));

    fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/in/route/build`, {
      method: 'POST',
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
        referral,
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
          } catch (e) {
            setAttempTx(false);
            setTxError(e as Error);
          }
        }
      })
      .finally(() => setAttempTx(false));
  };

  if (attempTx || txHash || txError) {
    const dexName =
      typeof DEXES_INFO[poolType].name === 'string' ? DEXES_INFO[poolType].name : DEXES_INFO[poolType].name[chainId];
    const errorMessage = txError ? friendlyError(txError) || txError.message || JSON.stringify(txError) : '';

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
          txStatus !== 'success' && txStatus !== 'failed' && !txError && !txHash
            ? `Confirm this transaction in your wallet - Zapping ${
                positionId && isUniV3
                  ? `Position #${positionId}`
                  : `${dexName} ${pool.token0.symbol}/${pool.token1.symbol} ${pool.fee}%`
              }`
            : undefined
        }
        errorMessage={txError ? errorMessage : undefined}
        transactionExplorerUrl={txHash ? `${NETWORKS_INFO[chainId].scanLink}/tx/${txHash}` : undefined}
        action={
          <>
            <button
              className="ks-outline-btn flex-1"
              onClick={() => {
                if (txStatus === 'success' && onClose) onClose();
                onDismiss();
              }}
            >
              Close
            </button>
            {txStatus === 'success' ? (
              onViewPosition ? (
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
        onClose={onDismiss}
      />
    );
  }

  return (
    <>
      <div className="flex justify-between text-xl font-medium">
        <div>{positionId ? 'Increase' : 'Add'} Liquidity via Zap</div>
        <div role="button" onClick={onDismiss} className="cursor-pointer">
          <X />
        </div>
      </div>
      <div className="ks-lw-preview">
        <Head pool={pool} />

        <ZapInAmount zapInfo={zapInfo} />
        <PriceInfo pool={pool} />

        <div className="flex flex-col items-center gap-3 mt-4">
          <PooledAmount pool={pool} positionAmountInfo={positionAmountInfo} addedAmountInfo={addedAmountInfo} />
          <EstimatedRow
            initializing={false}
            label="Remaining Amount"
            labelTooltip="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            value={
              <div className="text-sm">
                {formatCurrency(refundInfo.refundUsd)}
                {refundInfo.refundAmount0 || refundInfo.refundAmount1 ? (
                  <InfoHelper
                    text={
                      <div>
                        <div>
                          {refundInfo.refundAmount0} <TokenSymbol symbol={token0.symbol} maxWidth={80} />
                        </div>
                        <div>
                          {refundInfo.refundAmount1} <TokenSymbol symbol={token1.symbol} maxWidth={80} />
                        </div>
                      </div>
                    }
                  />
                ) : null}
              </div>
            }
            hasRoute
            className="w-full mt-0"
          />

          <SlippageWarning
            className="gap-4 w-full mt-0"
            slippage={slippage || 0}
            suggestedSlippage={zapInfo.zapDetails.suggestedSlippage}
            showWarning
          />

          <EstimatedRow
            initializing={false}
            label={
              <div
                className={cn(
                  'text-subText mt-[2px] w-fit border-b border-dotted border-subText',
                  zapInfo
                    ? zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                      ? 'border-error text-error'
                      : zapImpact.level === PI_LEVEL.HIGH
                        ? 'border-warning text-warning'
                        : 'border-subText'
                    : '',
                )}
              >
                Zap Impact
              </div>
            }
            labelTooltip="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
            value={
              <div
                className={cn(
                  'text-sm',
                  zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                    ? 'text-error'
                    : zapImpact.level === PI_LEVEL.HIGH
                      ? 'text-warning'
                      : 'text-text',
                )}
              >
                {zapImpact.display}
              </div>
            }
            hasRoute
            className="w-full mt-0"
          />

          <EstimatedRow
            initializing={false}
            label="Est. Gas Fee"
            labelTooltip={'Estimated network fee for your transaction.'}
            value={
              <div className="text-sm">
                {gasUsd
                  ? formatDisplayNumber(gasUsd, {
                      significantDigits: 4,
                      style: 'currency',
                    })
                  : '--'}
              </div>
            }
            hasRoute
            className="w-full mt-0"
          />

          <EstimatedRow
            initializing={false}
            label="Zap Fee"
            labelTooltip={
              <div>
                Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas
                fees.{' '}
                <a
                  className="text-accent"
                  href={API_URLS.DOCUMENT.ZAP_FEE_MODEL}
                  target="_blank"
                  rel="noopener norefferer noreferrer"
                >
                  More details.
                </a>
              </div>
            }
            value={<div className="text-sm">{parseFloat(feeInfo.protocolFee.toFixed(3))}%</div>}
            hasRoute
            className="w-full mt-0"
          />
        </div>

        <Warning zapInfo={zapInfo} slippage={slippage || 0} zapImpact={zapImpact} />

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
          {positionId ? 'Increase liquidity' : 'Add liquidity'}
        </button>
      </div>
    </>
  );
}
