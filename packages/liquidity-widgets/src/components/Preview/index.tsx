import { useState } from 'react';

import { API_URLS, CHAIN_ID_TO_CHAIN, DEXES_INFO, NETWORKS_INFO, univ3PoolNormalize } from '@kyber/schema';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  InfoHelper,
  MouseoverTooltip,
  StatusDialog,
  StatusDialogType,
  TokenLogo,
} from '@kyber/ui';
import { parseZapInfo } from '@kyber/utils';
import { friendlyError } from '@kyber/utils';
import { PI_LEVEL } from '@kyber/utils';
import { calculateGasMargin, estimateGas } from '@kyber/utils/crypto';
import { formatCurrency, formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import Info from '@/assets/svg/info.svg';
import SwitchIcon from '@/assets/svg/switch.svg';
import X from '@/assets/svg/x.svg';
import Warning from '@/components/Preview/Warning';
import useOnSuccess from '@/components/Preview/useOnSuccess';
import useTxStatus from '@/components/Preview/useTxStatus';
import { SlippageWarning } from '@/components/SlippageWarning';
import useSwapPI from '@/hooks/useSwapPI';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapState } from '@/types/index';
import { getPriceRangeToShow, parseTokensAndAmounts } from '@/utils';

export interface PreviewProps {
  zapState: ZapState;
  onDismiss: () => void;
}

export default function Preview({
  zapState: { pool, zapInfo, deadline, slippage, tickLower, tickUpper, gasUsd },
  onDismiss,
}: PreviewProps) {
  const { poolType, chainId, connectedAccount, theme, onSubmitTx, onViewPosition, referral, source, positionId } =
    useWidgetStore([
      'poolType',
      'chainId',
      'connectedAccount',
      'theme',
      'onSubmitTx',
      'onViewPosition',
      'referral',
      'source',
      'positionId',
    ]);
  const { position } = usePositionStore(['position']);
  const { revertPrice, toggleRevertPrice, poolPrice } = usePoolStore(['revertPrice', 'toggleRevertPrice', 'poolPrice']);
  const { tokensIn, amountsIn, setSlippage, setUiState, minPrice, maxPrice } = useZapState();

  const { address: account } = connectedAccount;
  const { tokensIn: listValidTokensIn, amountsIn: listValidAmountsIn } = parseTokensAndAmounts(tokensIn, amountsIn);

  const [txHash, setTxHash] = useState('');
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const { txStatus } = useTxStatus({ txHash });

  const { success: isUniV3, data: univ3Pool } = univ3PoolNormalize.safeParse(pool);
  const isOutOfRange = isUniV3 ? tickLower > univ3Pool.tick || univ3Pool.tick >= tickUpper : false;

  const { token0, token1 } = pool;
  const { swapActions, swapPriceImpact } = useSwapPI(zapInfo);
  const { refundInfo, addedAmountInfo, feeInfo, positionAmountInfo, zapImpact, suggestedSlippage } = parseZapInfo({
    zapInfo,
    token0,
    token1,
    position,
  });

  const priceRange = getPriceRangeToShow({
    pool,
    revertPrice,
    tickLower,
    tickUpper,
    minPrice,
    maxPrice,
  });
  useOnSuccess({
    pool,
    txHash,
    txStatus,
    positionAmountInfo,
    addedAmountInfo,
    zapInfo,
  });
  const quote = !revertPrice
    ? `${pool?.token1.symbol}/${pool?.token0.symbol}`
    : `${pool?.token0.symbol}/${pool?.token1.symbol}`;

  const rpcUrl = NETWORKS_INFO[chainId].defaultRpc;
  const dexName =
    typeof DEXES_INFO[poolType].name === 'string' ? DEXES_INFO[poolType].name : DEXES_INFO[poolType].name[chainId];
  const errorMessage = txError ? friendlyError(txError) || txError.message || JSON.stringify(txError) : '';

  const handleClick = async () => {
    setAttempTx(true);
    setTxHash('');
    setTxError(null);

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
            const txHash = await onSubmitTx({
              ...txData,
              gasLimit: calculateGasMargin(gasEstimation),
            });
            setTxHash(txHash);
          } catch (e) {
            setAttempTx(false);
            setTxError(e as Error);
          }
        }
      })
      .finally(() => setAttempTx(false));
  };

  const handleSlippage = () => {
    setUiState(prev => ({ ...prev, slippageOpen: true }));
    if (slippage !== suggestedSlippage) setSlippage(suggestedSlippage);
    onDismiss();
  };

  if (attempTx || txHash || txError) {
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
            <button className="ks-outline-btn flex-1" onClick={onDismiss}>
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
        <div className="flex items-center h-9 gap-4 mt-4 text-base">
          <div className="relative flex items-center">
            <TokenLogo src={pool.token0.logo} size={36} className="border-2 border-layer1" />
            <TokenLogo src={pool.token1.logo} size={36} className="border-2 border-layer1 relative -left-2" />
            <TokenLogo
              src={NETWORKS_INFO[chainId].logo}
              size={18}
              className="border-2 border-layer1 absolute bottom-0 -right-1"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              {pool.token0.symbol}/{pool.token1.symbol}
            </div>
            <div className="flex flex-wrap items-center gap-1 mt-[2px]">
              <div className="rounded-full text-xs leading-5 bg-layer2 px-2 py-0 h-max text-text flex items-center gap-1 brightness-75">
                Fee {pool.fee}%
              </div>
              {positionId !== undefined && isUniV3 && (
                <div className="rounded-full text-xs px-2 py-0 h-max flex items-center gap-1 bg-transparent text-success relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:opacity-20 before:bg-success before:rounded-full">
                  <Info width={12} /> ID {positionId}
                </div>
              )}
            </div>
          </div>

          {isOutOfRange && (
            <div
              className="rounded-full text-xs px-2 py-1 font-normal text-warning ml-auto"
              style={{
                background: `${theme.warning}33`,
              }}
            >
              Inactive{' '}
              <InfoHelper
                width="300px"
                color={theme.warning}
                text="Your liquidity is outside the current market range and will not be used/earn fees until the market price enters your specified range."
                size={16}
                style={{ position: 'relative', top: '-1px', margin: 0 }}
              />
            </div>
          )}
        </div>

        <div className="ks-lw-card mt-4">
          <div className="ks-lw-card-title">
            <p>Zap-in Amount</p>
            <p className="text-text font-normal text-lg">
              {formatDisplayNumber(+zapInfo.zapDetails.initialAmountUsd, { significantDigits: 6, style: 'currency' })}
            </p>
          </div>
          <div className="mt-2">
            {listValidTokensIn.map((token, index: number) => (
              <div className="flex items-center gap-2 mt-1" key={token.address}>
                <TokenLogo src={token.logo} size={18} />
                <span>
                  {formatDisplayNumber(listValidAmountsIn[index], {
                    significantDigits: 6,
                  })}{' '}
                  {token.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isUniV3 ? (
          <div className="ks-lw-card border border-stroke bg-transparent mt-4 text-sm">
            <div className="flex justify-between items-center gap-4 w-full">
              <div className="ks-lw-card-title">Current pool price</div>
              <div className="flex items-center gap-1 text-sm">
                <span>{formatDisplayNumber(poolPrice, { significantDigits: 6 })}</span>
                <span>{quote}</span>
                <SwitchIcon className="cursor-pointer" onClick={() => toggleRevertPrice()} role="button" />
              </div>
            </div>

            {priceRange && (
              <div className="flex justify-between items-center gap-4 w-full mt-2">
                <div className="ks-lw-card flex flex-col gap-[6px] items-center flex-1 w-1/2">
                  <div className="ks-lw-card-title">Min Price</div>
                  <div
                    title={priceRange?.minPrice?.toString()}
                    className="overflow-hidden text-ellipsis whitespace-nowrap w-full text-center"
                  >
                    {priceRange?.minPrice}
                  </div>
                  <div className="ks-lw-card-title">
                    <span>{quote}</span>
                  </div>
                </div>
                <div className="ks-lw-card flex flex-col gap-[6px] items-center flex-1 w-1/2">
                  <div className="ks-lw-card-title">Max Price</div>
                  <div
                    title={priceRange?.maxPrice?.toString()}
                    className="text-center w-full overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {priceRange?.maxPrice}
                  </div>
                  <div className="ks-lw-card-title">
                    <span>{quote}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="flex justify-between gap-4 w-full items-start">
            <div className="text-sm font-medium text-subText">Est. Pooled Amount</div>
            <div className="text-[14px] flex gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {pool?.token0?.logo && (
                    <TokenLogo src={pool.token0.logo} className={`relative ${positionId ? '' : 'mt-1 -top-1'}`} />
                  )}
                  <div>
                    {formatDisplayNumber(
                      positionId !== undefined ? positionAmountInfo.amount0 : addedAmountInfo.addedAmount0,
                      {
                        significantDigits: 4,
                      },
                    )}{' '}
                    {pool?.token0.symbol}
                  </div>
                </div>

                {positionId && (
                  <div className="text-end">
                    + {formatDisplayNumber(addedAmountInfo.addedAmount0, { significantDigits: 4 })}{' '}
                    {pool?.token0.symbol}
                  </div>
                )}
                <div className="ml-auto w-fit text-subText">
                  ~{formatCurrency(addedAmountInfo.addedAmount0Usd + positionAmountInfo.positionAmount0Usd)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {pool?.token1?.logo && (
                    <TokenLogo src={pool.token1.logo} className={`relative ${positionId ? '' : 'mt-1 -top-1'}`} />
                  )}
                  <div>
                    {formatDisplayNumber(
                      positionId !== undefined ? positionAmountInfo.amount1 : addedAmountInfo.addedAmount1,
                      {
                        significantDigits: 4,
                      },
                    )}{' '}
                    {pool?.token1.symbol}
                  </div>
                </div>
                {positionId && (
                  <div className="text-end">
                    + {formatDisplayNumber(addedAmountInfo.addedAmount1, { significantDigits: 4 })}{' '}
                    {pool?.token1.symbol}
                  </div>
                )}
                <div className="ml-auto w-fit text-subText">
                  ~{formatCurrency(addedAmountInfo.addedAmount1Usd + positionAmountInfo.positionAmount1Usd)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center gap-4 w-full">
            <MouseoverTooltip
              text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
              width="220px"
            >
              <div className="text-xs text-subText border-b border-dotted border-subText">Remaining Amount</div>
            </MouseoverTooltip>
            <span className="text-sm font-medium">
              {formatCurrency(refundInfo.refundUsd)}
              <InfoHelper
                text={
                  <div>
                    <div>
                      {refundInfo.refundAmount0} {pool.token0.symbol}{' '}
                    </div>
                    <div>
                      {refundInfo.refundAmount1} {pool.token1.symbol}
                    </div>
                  </div>
                }
              />
            </span>
          </div>

          <SlippageWarning
            className="gap-4 w-full mt-0"
            slippage={slippage}
            suggestedSlippage={zapInfo.zapDetails.suggestedSlippage}
            showWarning
          />

          <div className="flex justify-between items-center gap-4 w-full">
            {swapActions.length ? (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <MouseoverTooltip text="View all the detailed estimated price impact of each swap" width="220px">
                      <div
                        className={`text-xs border-b border-dotted border-subText ${
                          swapPriceImpact.piRes.level === PI_LEVEL.NORMAL
                            ? 'text-subText'
                            : swapPriceImpact.piRes.level === PI_LEVEL.HIGH
                              ? '!text-warning !border-warning'
                              : '!text-error !border-error'
                        }`}
                      >
                        Swap Price Impact
                      </div>
                    </MouseoverTooltip>
                  </AccordionTrigger>
                  <AccordionContent>
                    {swapActions.map((item, index: number) => (
                      <div
                        className={`text-xs flex justify-between align-middle ${
                          item.piRes.level === PI_LEVEL.NORMAL
                            ? 'text-subText brightness-125'
                            : item.piRes.level === PI_LEVEL.HIGH
                              ? 'text-warning'
                              : 'text-error'
                        }`}
                        key={index}
                      >
                        <div className="ml-3">
                          {item.amountIn} {item.tokenInSymbol} {'→ '}
                          {item.amountOut} {item.tokenOutSymbol}
                        </div>
                        <div>{item.piRes.display}</div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <>
                <MouseoverTooltip
                  text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
                  width="220px"
                >
                  <div className="border-b border-dotted border-subText text-xs text-subText">Swap Impact</div>
                </MouseoverTooltip>
                <span>--</span>
              </>
            )}
          </div>

          <div className="flex justify-between items-center gap-4 w-full">
            <MouseoverTooltip
              text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
              width="220px"
            >
              <div
                className={cn(
                  'text-xs text-subText border-b border-dotted border-subText',
                  zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                    ? 'border-error text-error'
                    : zapImpact.level === PI_LEVEL.HIGH
                      ? 'border-warning text-warning'
                      : 'border-subText text-subText',
                )}
              >
                Zap impact
              </div>
            </MouseoverTooltip>
            {zapInfo ? (
              <div
                className={`text-sm font-medium ${
                  zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                    ? 'text-error'
                    : zapImpact.level === PI_LEVEL.HIGH
                      ? 'text-warning'
                      : 'text-text'
                }`}
              >
                {zapImpact.display}
              </div>
            ) : (
              '--'
            )}
          </div>

          <div className="flex justify-between items-center gap-4 w-full">
            <MouseoverTooltip text="Estimated network fee for your transaction." width="220px">
              <div className="text-xs text-subText border-b border-dotted border-subText">Est. Gas Fee</div>
            </MouseoverTooltip>
            <div className="text-sm font-medium">
              {gasUsd
                ? formatDisplayNumber(gasUsd, {
                    significantDigits: 4,
                    style: 'currency',
                  })
                : '--'}
            </div>
          </div>

          <div className="flex justify-between items-center gap-4 w-full">
            <MouseoverTooltip
              text={
                <div>
                  Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas
                  fees.{' '}
                  <a
                    className="text-accent"
                    href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model"
                    target="_blank"
                    rel="noopener norefferer noreferrer"
                  >
                    More details.
                  </a>
                </div>
              }
              width="220px"
            >
              <div className="text-xs text-subText border-b border-dotted border-subText">Zap Fee</div>
            </MouseoverTooltip>
            <div className="text-sm font-medium">{parseFloat(feeInfo.protocolFee.toFixed(3))}%</div>
          </div>
        </div>

        <Warning zapInfo={zapInfo} slippage={slippage} zapImpact={zapImpact} />

        <p className="text-[#737373] italic text-xs mt-4">
          The information is intended solely for your reference at the time you are viewing. It is your responsibility
          to verify all information before making decisions
        </p>

        <button
          className={`ks-primary-btn mt-4 w-full ${
            zapImpact.level === PI_LEVEL.VERY_HIGH ||
            zapImpact.level === PI_LEVEL.INVALID ||
            swapPriceImpact.piRes.level === PI_LEVEL.VERY_HIGH ||
            swapPriceImpact.piRes.level === PI_LEVEL.INVALID
              ? 'bg-error border-error text-white'
              : zapImpact.level === PI_LEVEL.HIGH || swapPriceImpact.piRes.level === PI_LEVEL.HIGH
                ? 'bg-warning border-warning'
                : ''
          }`}
          onClick={handleClick}
        >
          {positionId ? 'Increase liquidity' : 'Add liquidity'}
        </button>
      </div>
    </>
  );
}
