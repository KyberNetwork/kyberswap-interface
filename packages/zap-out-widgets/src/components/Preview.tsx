import { useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { DEXES_INFO, NETWORKS_INFO, univ3Types } from '@kyber/schema';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  MouseoverTooltip,
  StatusDialog,
  StatusDialogType,
  TokenLogo,
  TokenSymbol,
} from '@kyber/ui';
import { PI_LEVEL, friendlyError } from '@kyber/utils';
import { calculateGasMargin, estimateGas } from '@kyber/utils/crypto';
import { formatCurrency, formatDisplayNumber, formatTokenAmount } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import { SlippageWarning } from '@/components/SlippageWarning';
import { WarningMsg } from '@/components/WarningMsg';
import useTxStatus from '@/hooks/useTxStatus';
import useZapRoute from '@/hooks/useZapRoute';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export const Preview = () => {
  const { onClose, pool, positionId, theme, position, chainId, connectedAccount, onSubmitTx, poolType, rpcUrl } =
    useZapOutContext(s => s);

  const { address: account } = connectedAccount;
  const isUniV3 = univ3Types.includes(poolType as any);

  const { buildData, slippage, setBuildData, tokenOut, route, mode, setSlippage } = useZapOutUserState();
  const { zapImpact, refund, suggestedSlippage, zapFee, removeLiquidity, earnedFee } = useZapRoute();

  const [error, setError] = useState<Error | undefined>();

  const [showProcessing, setShowProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { txStatus } = useTxStatus({ txHash: txHash || undefined });

  if (!pool || !position || !tokenOut || !route) return null;

  const pi = {
    piHigh: zapImpact.level === PI_LEVEL.HIGH,
    piVeryHigh: zapImpact.level === PI_LEVEL.VERY_HIGH,
  };

  const handleSlippage = () => {
    if (slippage !== suggestedSlippage) setSlippage(suggestedSlippage);
    setBuildData(undefined);
    setTxHash(null);
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
        title={
          txStatus === 'success' ? (mode === 'zapOut' ? t`Zap Out Success!` : t`Remove Liquidity Success!`) : undefined
        }
        description={
          txStatus !== 'success' && txStatus !== 'failed' && !error && !txHash
            ? t`Confirm this transaction in your wallet`
            : txStatus === 'success'
              ? t`You have successfully removed your liquidity`
              : undefined
        }
        errorMessage={error ? errorMessage : undefined}
        transactionExplorerUrl={txHash ? `${NETWORKS_INFO[chainId].scanLink}/tx/${txHash}` : undefined}
        action={
          <>
            <button
              className="ks-outline-btn flex-1"
              onClick={() => {
                if (txStatus === 'success') {
                  onClose();
                  setBuildData(undefined);
                } else if (error) {
                  setShowProcessing(false);
                  setError(undefined);
                }
                setTxHash(null);
              }}
            >
              <Trans>Close</Trans>
            </button>
            {txStatus !== 'success' && errorMessage.includes('slippage') ? (
              <button className="ks-primary-btn flex-1" onClick={handleSlippage}>
                {slippage !== suggestedSlippage ? t`Use Suggested Slippage` : t`Set Custom Slippage`}
              </button>
            ) : null}
          </>
        }
        onClose={() => {
          setBuildData(undefined);
          setShowProcessing(false);
          setError(undefined);
          setTxHash(null);
        }}
      />
    );
  }

  const color =
    zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
      ? theme.error
      : zapImpact.level === PI_LEVEL.HIGH
        ? theme.warning
        : theme.subText;

  const handleConfirm = async () => {
    if (!account) return;
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
          pool: `${pool.token0.symbol}/${pool.token1.symbol}`,
          dexLogo: DEXES_INFO[poolType].icon,
          tokensOut:
            mode === 'zapOut'
              ? [
                  {
                    symbol: tokenOut.symbol,
                    amount: formatDisplayNumber(refund.refunds[0]?.amount || 0, { significantDigits: 6 }),
                    logoUrl: tokenOut.logo,
                  },
                ]
              : [
                  {
                    symbol: pool.token0.symbol,
                    amount: formatTokenAmount(
                      removeLiquidity.removedAmount0 + earnedFee.earnedFee0,
                      pool.token0.decimals,
                      6,
                    ),
                    logoUrl: pool.token0.logo,
                  },
                  {
                    symbol: pool.token1.symbol,
                    amount: formatTokenAmount(
                      removeLiquidity.removedAmount1 + earnedFee.earnedFee1,
                      pool.token1.decimals,
                      6,
                    ),

                    logoUrl: pool.token1.logo,
                  },
                ],
        },
      );
      setTxHash(txHash);
    } catch (err) {
      setError(err as Error);
    }
  };

  return (
    <Dialog
      open={Boolean(buildData)}
      onOpenChange={() => {
        setBuildData(undefined);
        setTxHash(null);
      }}
    >
      <DialogContent className="ks-lw-style max-h-[85vh] max-w-[480px] overflow-auto" aria-describedby={undefined}>
        <DialogTitle>{mode === 'zapOut' ? t`Remove Liquidity via Zap` : t`Remove Liquidity`}</DialogTitle>
        <div>
          {' '}
          <div className="flex gap-3 items-center mt-4">
            <div className="flex items-end">
              <TokenLogo src={pool.token0.logo} size={36} alt={pool.token0.symbol} />
              <TokenLogo src={pool.token1.logo} size={36} alt={pool.token1.symbol} className="-ml-2" />
              <TokenLogo
                src={NETWORKS_INFO[chainId].logo}
                size={18}
                alt={NETWORKS_INFO[chainId].name}
                className="-ml-2"
              />
            </div>

            <div>
              <div className="text-base flex items-center">
                <TokenSymbol symbol={pool.token0.symbol} maxWidth={80} />/
                <TokenSymbol symbol={pool.token1.symbol} maxWidth={80} /> {isUniV3 ? `#${positionId}` : ''}
              </div>
              <div className="rounded-full text-xs bg-layer2 text-text px-3 py-[2px] w-fit">
                <Trans>Fee {pool.fee}%</Trans>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl p-4 bg-layer2">
            <div className="text-subText text-sm">{mode === 'zapOut' ? t`Zap-out Amount` : t`Receiving Amount`}</div>
            {mode === 'zapOut' && (
              <div className="flex mt-3 text-base items-center">
                <TokenLogo src={tokenOut.logo} size={20} alt={tokenOut.symbol} />
                <div className="ml-1 flex items-center gap-1">
                  {formatDisplayNumber(refund.refunds[0]?.amount, { significantDigits: 8 })}{' '}
                  <TokenSymbol symbol={tokenOut.symbol} maxWidth={80} />
                </div>
                <div className="ml-2 text-subText">~{formatCurrency(refund.value)}</div>
              </div>
            )}
            {mode === 'withdrawOnly' && (
              <>
                <div className="flex gap-1 items-center mt-3">
                  <TokenLogo src={pool.token0.logo || ''} className="w-5 h-5" />
                  <span className="text-lg font-medium flex items-center gap-1">
                    {formatTokenAmount(removeLiquidity.removedAmount0 + earnedFee.earnedFee0, pool.token0.decimals, 8)}{' '}
                    <TokenSymbol symbol={pool.token0.symbol} maxWidth={80} />
                  </span>
                  <span className="text-subText ml-1">
                    ~{formatDisplayNumber(removeLiquidity.removedValue0 + earnedFee.feeValue0, { style: 'currency' })}
                  </span>
                </div>
                <div className="flex gap-1 items-center mt-3">
                  <TokenLogo src={pool.token1.logo || ''} className="w-5 h-5" />
                  <span className="text-lg font-medium flex items-center gap-1">
                    {formatTokenAmount(removeLiquidity.removedAmount1 + earnedFee.earnedFee1, pool.token1.decimals, 8)}{' '}
                    <TokenSymbol symbol={pool.token1.symbol} maxWidth={80} />
                  </span>
                  <span className="text-subText ml-1">
                    ~{formatDisplayNumber(removeLiquidity.removedValue1 + earnedFee.feeValue1, { style: 'currency' })}
                  </span>
                </div>
              </>
            )}
          </div>
          {mode === 'zapOut' && (
            <>
              <div className="flex flex-col mt-4 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-subText text-xs flex items-center gap-1">
                    <Trans>
                      Est. Received <TokenSymbol symbol={tokenOut.symbol} maxWidth={80} />
                    </Trans>
                  </div>
                  <div className="flex items-center gap-1">
                    <TokenLogo src={tokenOut.logo} alt={tokenOut.symbol} />
                    {refund.refunds[0]?.amount || 0}
                    <TokenSymbol symbol={tokenOut.symbol} maxWidth={80} />
                  </div>
                </div>

                <SlippageWarning
                  slippage={slippage}
                  suggestedSlippage={suggestedSlippage}
                  className="mt-0"
                  showWarning={!!route}
                />

                <div className="flex items-center justify-between">
                  <MouseoverTooltip
                    text={t`The difference between input and estimated received (including remaining amount). Be careful with high value!`}
                    width="220px"
                  >
                    <div
                      className="text-subText text-xs border-b border-dotted border-subText"
                      style={
                        route
                          ? {
                              color,
                              borderColor: color,
                            }
                          : {}
                      }
                    >
                      <Trans>Zap Impact</Trans>
                    </div>
                  </MouseoverTooltip>
                  <div
                    style={{
                      color:
                        zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                          ? theme.error
                          : zapImpact.level === PI_LEVEL.HIGH
                            ? theme.warning
                            : theme.text,
                    }}
                  >
                    {zapImpact.display}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <MouseoverTooltip text={t`Estimated network fee for your transaction.`} width="220px">
                    <div className="text-subText text-xs border-b border-dotted border-subText">
                      <Trans>Est. Gas Fee</Trans>
                    </div>
                  </MouseoverTooltip>
                  <div>
                    {buildData
                      ? formatDisplayNumber(buildData.gasUsd, {
                          significantDigits: 4,
                          style: 'currency',
                        })
                      : '--'}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <MouseoverTooltip
                    text={
                      <Trans>
                        Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard
                        gas fees.{' '}
                        <a
                          style={{ color: theme.accent }}
                          href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          More details.
                        </a>
                      </Trans>
                    }
                    width="220px"
                  >
                    <div className="text-subText text-xs border-b border-dotted border-subText">
                      <Trans>Zap Fee</Trans>
                    </div>
                  </MouseoverTooltip>
                  <div>{parseFloat(zapFee.toFixed(3))}%</div>
                </div>
              </div>

              {slippage && (slippage > 2 * suggestedSlippage || slippage < suggestedSlippage / 2) && (
                <div
                  className="rounded-md text-xs px-4 py-3 mt-4 font-normal text-warning"
                  style={{
                    backgroundColor: `${theme.warning}33`,
                  }}
                >
                  {slippage > 2 * suggestedSlippage
                    ? t`Your slippage is set higher than usual, which may cause unexpected losses.`
                    : t`Your slippage is set lower than usual, increasing the risk of transaction failure.`}
                </div>
              )}

              <div className="text-xs italic mt-4 text-subText">
                <Trans>
                  The information is intended solely for your reference at the time you are viewing. It is your
                  responsibility to verify all information before making decisions
                </Trans>
              </div>

              <WarningMsg />
            </>
          )}
          {mode === 'withdrawOnly' && (
            <>
              <div className="flex flex-col mt-4 gap-3 text-sm">
                <div className="flex items-start justify-between">
                  <div className="text-subText">
                    <Trans>Slippage</Trans>
                  </div>
                  <span>{slippage ? ((slippage * 100) / 10_000).toFixed(2) + '%' : '--'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <MouseoverTooltip text={t`Estimated network fee for your transaction.`} width="220px">
                    <div className="text-subText text-xs border-b border-dotted border-subText">
                      <Trans>Est. Gas Fee</Trans>
                    </div>
                  </MouseoverTooltip>
                  <div>
                    {buildData
                      ? formatDisplayNumber(buildData.gasUsd, {
                          significantDigits: 4,
                          style: 'currency',
                        })
                      : '--'}
                  </div>
                </div>
              </div>
              <div className="text-xs italic mt-4 text-subText">
                <Trans>
                  The information is intended solely for your reference at the time you are viewing. It is your
                  responsibility to verify all information before making decisions
                </Trans>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <button
            className={cn(
              'ks-primary-btn w-full mt-4',
              pi.piVeryHigh
                ? 'bg-error border-solid border-error text-white'
                : pi.piHigh
                  ? 'bg-warning border-solid border-warning'
                  : '',
            )}
            onClick={handleConfirm}
          >
            <Trans>Remove Liquidity</Trans>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
