import { useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { API_URLS, CHAIN_ID_TO_CHAIN, DEXES_INFO, NETWORKS_INFO, PoolType, univ3PoolNormalize } from '@kyber/schema';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  InfoHelper,
  MouseoverTooltip,
  ScrollArea,
  TokenLogo,
} from '@kyber/ui';
import { fetchTokenPrice, getSwapPriceImpactFromActions, parseSwapActions, parseZapInfo } from '@kyber/utils';
import { friendlyError } from '@kyber/utils';
import { PI_LEVEL } from '@kyber/utils';
import {
  calculateGasMargin,
  estimateGas,
  formatUnits,
  getCurrentGasPrice,
  isTransactionSuccessful,
} from '@kyber/utils/crypto';
import { formatCurrency, formatDisplayNumber, formatNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';
import { tickToPrice } from '@kyber/utils/uniswapv3';

import ErrorIcon from '@/assets/svg/error.svg';
import Info from '@/assets/svg/info.svg';
import Spinner from '@/assets/svg/loader.svg';
import SuccessIcon from '@/assets/svg/success.svg';
import SwitchIcon from '@/assets/svg/switch.svg';
import X from '@/assets/svg/x.svg';
import { SlippageWarning } from '@/components/SlippageWarning';
import { getSlippageStorageKey } from '@/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapState } from '@/types/index';
import { parseTokensAndAmounts } from '@/utils';

export interface PreviewProps {
  zapState: ZapState;
  onDismiss: () => void;
}

export default function Preview({
  zapState: { pool, zapInfo, deadline, slippage, tickLower, tickUpper },
  onDismiss,
}: PreviewProps) {
  const {
    poolType,
    chainId,
    connectedAccount,
    theme,
    onSubmitTx,
    onViewPosition,
    referral,
    source,
    wrappedNativeToken,
    nativeToken,
    positionId,
    onSuccess,
  } = useWidgetStore(
    useShallow(s => ({
      poolType: s.poolType,
      chainId: s.chainId,
      connectedAccount: s.connectedAccount,
      theme: s.theme,
      onSubmitTx: s.onSubmitTx,
      onViewPosition: s.onViewPosition,
      referral: s.referral,
      source: s.source,
      wrappedNativeToken: s.wrappedNativeToken,
      nativeToken: s.nativeToken,
      positionId: s.positionId,
      onSuccess: s.onSuccess,
    })),
  );
  const { position } = usePositionStore(
    useShallow(s => ({
      position: s.position,
    })),
  );
  const { revertPrice, toggleRevertPrice, poolPrice } = usePoolStore(
    useShallow(s => ({ revertPrice: s.revertPrice, toggleRevertPrice: s.toggleRevertPrice, poolPrice: s.poolPrice })),
  );

  const { address: account } = connectedAccount;
  const { tokensIn, amountsIn } = useZapState();
  const { tokensIn: listValidTokensIn, amountsIn: listValidAmountsIn } = parseTokensAndAmounts(tokensIn, amountsIn);

  const [txHash, setTxHash] = useState('');
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const [txStatus, setTxStatus] = useState<'success' | 'failed' | ''>('');
  const [gasUsd, setGasUsd] = useState<number | null>(null);
  const [onSuccessTriggered, setOnSuccessTriggered] = useState(false);

  const { success: isUniV3, data: univ3Pool } = univ3PoolNormalize.safeParse(pool);
  const isOutOfRange = isUniV3 ? tickLower > univ3Pool.tick || univ3Pool.tick >= tickUpper : false;

  const { icon: dexLogo } = DEXES_INFO[poolType as PoolType];

  const suggestedSlippage = zapInfo?.zapDetails.suggestedSlippage || 0;

  useEffect(() => {
    if (txHash) {
      const i = setInterval(() => {
        isTransactionSuccessful(NETWORKS_INFO[chainId].defaultRpc, txHash).then(res => {
          if (!res) return;

          if (res.status) {
            setTxStatus('success');
          } else setTxStatus('failed');
        });
      }, 10_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [chainId, txHash]);

  const { token0, token1 } = pool;
  const { refundInfo, addedAmountInfo, feeInfo, positionAmountInfo, zapImpact } = parseZapInfo({
    zapInfo,
    token0,
    token1,
    position,
  });

  const priceRange = useMemo(() => {
    if (!univ3Pool) return null;
    const maxPrice =
      tickUpper === univ3Pool.maxTick
        ? revertPrice
          ? '0'
          : '∞'
        : formatNumber(
            parseFloat(
              tickToPrice(
                !revertPrice ? tickUpper : tickLower,
                pool.token0?.decimals,
                pool.token1?.decimals,
                revertPrice,
              ),
            ),
          );
    const minPrice =
      tickLower === univ3Pool.minTick
        ? revertPrice
          ? '∞'
          : '0'
        : formatNumber(
            parseFloat(
              tickToPrice(
                !revertPrice ? tickLower : tickUpper,
                pool.token0?.decimals,
                pool.token1?.decimals,
                revertPrice,
              ),
            ),
          );

    return [minPrice, maxPrice];
  }, [univ3Pool, tickUpper, revertPrice, pool.token0?.decimals, pool.token1?.decimals, tickLower]);

  const quote = (
    <span>
      {!revertPrice ? `${pool?.token1.symbol}/${pool?.token0.symbol}` : `${pool?.token0.symbol}/${pool?.token1.symbol}`}
    </span>
  );

  const tokensToCheck = useMemo(
    () => [...tokensIn, token0, token1, wrappedNativeToken, nativeToken],
    [tokensIn, token0, token1, wrappedNativeToken, nativeToken],
  );
  const swapActions = parseSwapActions({ zapInfo, tokens: tokensToCheck, poolType, chainId });
  const swapPriceImpact = getSwapPriceImpactFromActions(swapActions);
  const rpcUrl = NETWORKS_INFO[chainId].defaultRpc;

  useEffect(() => {
    fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/in/route/build`, {
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
        if (data?.callData && account) {
          const txData = {
            from: account,
            to: data.routerAddress,
            data: data.callData,
            value: `0x${BigInt(data.value).toString(16)}`,
          };

          try {
            const wethAddress = NETWORKS_INFO[chainId].wrappedToken.address.toLowerCase();
            const [gasEstimation, nativeTokenPrice, gasPrice] = await Promise.all([
              estimateGas(rpcUrl, txData),
              fetchTokenPrice({ addresses: [wethAddress], chainId })
                .then((prices: { [x: string]: { PriceBuy: number } }) => {
                  return prices[wethAddress]?.PriceBuy || 0;
                })
                .catch(() => 0),
              getCurrentGasPrice(rpcUrl),
            ]);

            const gasUsd = +formatUnits(gasPrice, 18) * +gasEstimation.toString() * nativeTokenPrice;

            setGasUsd(gasUsd);
          } catch (e) {
            console.log('Estimate gas failed', e);
          }
        }
      });
  }, [account, chainId, deadline, rpcUrl, source, zapInfo.route]);

  useEffect(() => {
    if (!txHash || txStatus !== 'success' || !onSuccess || onSuccessTriggered) return;

    setOnSuccessTriggered(true);

    onSuccess({
      txHash,
      position: {
        positionId,
        chainId,
        poolType,
        dexLogo,
        token0: {
          address: pool.token0.address,
          symbol: pool.token0.symbol,
          logo: pool.token0.logo || '',
          amount: positionId !== undefined ? positionAmountInfo.amount0 : addedAmountInfo.addedAmount0,
        },
        token1: {
          address: pool.token1.address,
          symbol: pool.token1.symbol,
          logo: pool.token1.logo || '',
          amount: positionId !== undefined ? positionAmountInfo.amount1 : addedAmountInfo.addedAmount1,
        },
        pool: {
          address: pool.address,
          fee: pool.fee,
        },
        value:
          position !== undefined
            ? addedAmountInfo.addedAmount0Usd +
              positionAmountInfo.positionAmount0Usd +
              addedAmountInfo.addedAmount1Usd +
              positionAmountInfo.positionAmount1Usd
            : +zapInfo.zapDetails.initialAmountUsd,
        createdAt: Date.now(),
      },
    });
  }, [
    addedAmountInfo.addedAmount0,
    addedAmountInfo.addedAmount1,
    chainId,
    dexLogo,
    onSuccess,
    onSuccessTriggered,
    pool.address,
    pool.fee,
    pool.token0.address,
    pool.token1.address,
    pool.token0.logo,
    pool.token0.symbol,
    pool.token1.logo,
    pool.token1.symbol,
    poolType,
    positionAmountInfo.amount0,
    positionAmountInfo.amount1,
    positionId,
    txHash,
    txStatus,
    zapInfo.zapDetails.initialAmountUsd,
    positionAmountInfo.positionAmount0Usd,
    positionAmountInfo.positionAmount1Usd,
    addedAmountInfo.addedAmount0Usd,
    addedAmountInfo.addedAmount1Usd,
    position,
  ]);

  const dexName =
    typeof DEXES_INFO[poolType].name === 'string' ? DEXES_INFO[poolType].name : DEXES_INFO[poolType].name[chainId];

  const handleClick = async () => {
    setAttempTx(true);
    setTxHash('');
    setTxError(null);

    if (suggestedSlippage > 0 && slippage !== suggestedSlippage) {
      try {
        const storageKey = getSlippageStorageKey(pool.token0.symbol, pool.token1.symbol);
        localStorage.setItem(storageKey, slippage.toString());
      } catch (error) {
        // Silently handle localStorage errors
        console.warn('Failed to save slippage to localStorage:', error);
      }
    }

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

  if (attempTx || txHash) {
    let txStatusText = '';
    if (txHash) {
      if (txStatus === 'success') txStatusText = 'Transaction successful';
      else if (txStatus === 'failed') txStatusText = 'Transaction failed';
      else txStatusText = 'Processing transaction';
    } else {
      txStatusText = 'Waiting For Confirmation';
    }

    return (
      <div className="mt-4 gap-4 flex flex-col justify-center items-center text-base font-medium">
        <div className="flex justify-center gap-3 flex-col items-center flex-1">
          <div className="flex items-center justify-center gap-2 text-xl font-medium">
            {txStatus === 'success' ? (
              <SuccessIcon className="w-6 h-6 text-success rounded-full border border-success p-[2px]" />
            ) : txStatus === 'failed' ? (
              <ErrorIcon className="w-6 h-6 text-error" />
            ) : (
              <Spinner className="w-6 h-6 text-success animate-spin" />
            )}
            <div className="text-xl my-4">{txStatusText}</div>
          </div>

          {!txHash && (
            <div className="text-sm text-subText text-center">
              Confirm this transaction in your wallet - Zapping{' '}
              {positionId && isUniV3
                ? `Position #${positionId}`
                : `${dexName} ${pool.token0.symbol}/${pool.token1.symbol} ${pool.fee}%`}
            </div>
          )}
          {txHash && txStatus === '' && (
            <div className="text-sm text-subText">Waiting for the transaction to be mined</div>
          )}
        </div>

        {txHash && (
          <a
            className="flex justify-end items-center text-accent text-sm gap-1"
            href={`${NETWORKS_INFO[chainId].scanLink}/tx/${txHash}`}
            target="_blank"
            rel="noopener norefferer noreferrer"
          >
            View transaction ↗
          </a>
        )}
        <div className="flex gap-4 w-full mt-2">
          <button
            className={cn(onViewPosition ? 'ks-outline-btn flex-1' : 'ks-primary-btn flex-1')}
            onClick={onDismiss}
          >
            Close
          </button>
          {txStatus === 'success' && onViewPosition && (
            <button className="ks-primary-btn flex-1" onClick={() => onViewPosition(txHash)}>
              View position
            </button>
          )}
        </div>
      </div>
    );
  }

  if (txError) {
    return (
      <div className="gap-2 flex flex-col justify-center items-center text-base font-medium">
        <div className="flex pt-1 items-center justify-center gap-2 font-medium">
          <ErrorIcon className="w-6 h-6 text-error" />
          <div className="max-w-[86%] font-medium my-3">Failed to add liquidity</div>
        </div>

        <ScrollArea>
          <div className="text-subText break-all	text-center max-h-[200px]" style={{ wordBreak: 'break-word' }}>
            {friendlyError(txError) || txError?.message || JSON.stringify(txError)}
          </div>
        </ScrollArea>
      </div>
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
                {quote}
                <SwitchIcon className="cursor-pointer" onClick={() => toggleRevertPrice()} role="button" />
              </div>
            </div>

            {priceRange && (
              <div className="flex justify-between items-center gap-4 w-full mt-2">
                <div className="ks-lw-card flex flex-col gap-[6px] items-center flex-1 w-1/2">
                  <div className="ks-lw-card-title">Min Price</div>
                  <div
                    title={priceRange[0]}
                    className="overflow-hidden text-ellipsis whitespace-nowrap w-full text-center"
                  >
                    {priceRange[0]}
                  </div>
                  <div className="ks-lw-card-title">{quote}</div>
                </div>
                <div className="ks-lw-card flex flex-col gap-[6px] items-center flex-1 w-1/2">
                  <div className="ks-lw-card-title">Max Price</div>
                  <div
                    title={priceRange[1]}
                    className="text-center w-full overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {priceRange[1]}
                  </div>
                  <div className="ks-lw-card-title">{quote}</div>
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

        {(slippage > 2 * zapInfo.zapDetails.suggestedSlippage ||
          slippage < zapInfo.zapDetails.suggestedSlippage / 2) && (
          <div
            className="rounded-md text-xs px-4 py-3 mt-4 font-normal text-warning"
            style={{
              backgroundColor: `${theme.warning}33`,
            }}
          >
            {slippage > zapInfo.zapDetails.suggestedSlippage * 2
              ? 'Your slippage is set higher than usual, which may cause unexpected losses.'
              : 'Your slippage is set lower than usual, increasing the risk of transaction failure.'}
          </div>
        )}

        {zapInfo && swapPriceImpact.piRes.level !== PI_LEVEL.NORMAL && (
          <div
            className={`rounded-md text-xs px-4 py-3 mt-4 font-normal ${
              swapPriceImpact.piRes.level === PI_LEVEL.HIGH ? 'text-warning' : 'text-error'
            }`}
            style={{
              backgroundColor:
                swapPriceImpact.piRes.level === PI_LEVEL.HIGH ? `${theme.warning}33` : `${theme.error}33`,
            }}
          >
            {swapPriceImpact.piRes.msg}
          </div>
        )}

        {zapInfo && zapImpact.level !== PI_LEVEL.NORMAL && (
          <div
            className={`rounded-md text-xs px-4 py-3 mt-4 font-normal ${zapImpact.level === PI_LEVEL.HIGH ? 'text-warning' : 'text-error'}`}
            style={{
              backgroundColor: zapImpact.level === PI_LEVEL.HIGH ? `${theme.warning}33` : `${theme.error}33`,
            }}
          >
            {zapImpact.msg}
          </div>
        )}

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
              ? 'bg-error border-error'
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
