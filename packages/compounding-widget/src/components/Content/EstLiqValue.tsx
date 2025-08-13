import { useMemo } from 'react';

import { useShallow } from 'zustand/shallow';

import { defaultToken } from '@kyber/schema';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  InfoHelper,
  MouseoverTooltip,
  Skeleton,
  TokenLogo,
} from '@kyber/ui';
import { PI_LEVEL, getSwapPriceImpactFromActions, parseSwapActions, parseZapInfo } from '@kyber/utils';
import { formatCurrency, formatNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import { SlippageWarning } from '@/components/SlippageWarning';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function EstLiqValue() {
  const { theme, chainId, poolType, wrappedNativeToken, nativeToken, positionId } = useWidgetStore(
    useShallow(s => ({
      theme: s.theme,
      chainId: s.chainId,
      poolType: s.poolType,
      wrappedNativeToken: s.wrappedNativeToken,
      nativeToken: s.nativeToken,
      positionId: s.positionId,
    })),
  );
  const { zapInfo, slippage, tokensIn } = useZapState();
  const pool = usePoolStore(s => s.pool);
  const { position } = usePositionStore(
    useShallow(s => ({
      position: s.position,
    })),
  );

  const initializing = pool === 'loading';
  const { token0, token1 } = initializing ? { token0: defaultToken, token1: defaultToken } : pool;
  const {
    refundInfo,
    addedAmountInfo,
    initUsd,
    suggestedSlippage,
    isHighRemainingAmount,
    positionAmountInfo,
    zapImpact,
  } = parseZapInfo({ zapInfo, token0, token1, position });

  const tokensToCheck = useMemo(
    () => [...tokensIn, token0, token1, wrappedNativeToken, nativeToken],
    [tokensIn, token0, token1, wrappedNativeToken, nativeToken],
  );
  const swapActions = parseSwapActions({ zapInfo, tokens: tokensToCheck, poolType, chainId });
  const swapPriceImpact = getSwapPriceImpactFromActions(swapActions);

  return (
    <>
      <div className="border border-stroke rounded-md py-3 px-4">
        <div className="text-sm mb-1 flex justify-between">
          Est. Liquidity Value
          {!!positionAmountInfo.addedAmountUsd && <span>{formatCurrency(positionAmountInfo.addedAmountUsd)}</span>}
        </div>
        <div className="ks-cw-divider" />

        <div className="flex justify-between items-start mt-3 text-xs">
          <div className="text-subText mt-[2px] w-fit flex items-center">
            Est. Pooled {initializing ? <Skeleton className="w-10 h-4 ml-2" /> : token0.symbol}
          </div>
          {initializing ? (
            <Skeleton className="w-14 h-4" />
          ) : zapInfo ? (
            <div>
              <div className="flex justify-end items-start gap-1">
                {token0.logo && <TokenLogo src={token0.logo} size={14} className="mt-[2px]" />}
                <div className="text-end">
                  {formatNumber(positionId !== undefined ? positionAmountInfo.amount0 : addedAmountInfo.addedAmount0)}{' '}
                  {token0.symbol}
                </div>
              </div>
              {positionId && (
                <div className="text-end">
                  + {formatNumber(addedAmountInfo.addedAmount0)} {token0.symbol}
                </div>
              )}

              <div className="text-subText mt-[2px] w-fit ml-auto">
                ~{formatCurrency(addedAmountInfo.addedAmount0Usd + positionAmountInfo.positionAmount0Usd)}
              </div>
            </div>
          ) : (
            '--'
          )}
        </div>

        <div className="flex justify-between items-start mt-3 text-xs">
          <div className="text-subText mt-[2px] w-fit flex items-center">
            Est. Pooled {initializing ? <Skeleton className="w-10 h-4 ml-2" /> : token1.symbol}
          </div>
          {initializing ? (
            <Skeleton className="w-14 h-4" />
          ) : zapInfo ? (
            <div>
              <div className="flex justify-end items-start gap-1">
                {token1.logo && <TokenLogo src={token1.logo} size={14} className="mt-[2px]" />}
                <div className="text-end">
                  {formatNumber(positionId !== undefined ? positionAmountInfo.amount1 : addedAmountInfo.addedAmount1)}{' '}
                  {token1.symbol}
                </div>
              </div>
              {positionId && (
                <div className="text-end">
                  + {formatNumber(addedAmountInfo.addedAmount1)} {token1.symbol}
                </div>
              )}

              <div className="text-subText mt-[2px] w-fit ml-auto">
                ~{formatCurrency(addedAmountInfo.addedAmount1Usd + positionAmountInfo.positionAmount1Usd)}
              </div>
            </div>
          ) : (
            '--'
          )}
        </div>

        <div className="flex justify-between items-start mt-3 text-xs">
          <MouseoverTooltip
            text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            width="220px"
          >
            <div className="text-subText mt-[2px] w-fit border-b border-dotted border-subText">
              Est. Remaining Value
            </div>
          </MouseoverTooltip>

          {initializing ? (
            <Skeleton className="w-14 h-4" />
          ) : (
            <div>
              {formatCurrency(refundInfo.refundUsd)}
              <InfoHelper
                text={
                  <div>
                    <div>
                      {refundInfo.refundAmount0} {token0.symbol}{' '}
                    </div>
                    <div>
                      {refundInfo.refundAmount1} {token1.symbol}
                    </div>
                  </div>
                }
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-start mt-3 text-xs">
          {swapActions.length ? (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <MouseoverTooltip text="View all the detailed estimated price impact of each swap" width="220px">
                    <div
                      className={`text-subText mt-[2px] w-fit border-b border-dotted border-subText text-xs ${
                        swapPriceImpact.piRes.level === PI_LEVEL.NORMAL
                          ? ''
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
                <div className="text-subText mt-[2px] w-fit border-b border-dotted border-subText">
                  Swap Price Impact
                </div>
              </MouseoverTooltip>
              {initializing ? <Skeleton className="w-14 h-4" /> : <span>--</span>}
            </>
          )}
        </div>

        <SlippageWarning
          className="mt-3 text-xs"
          slippage={slippage}
          suggestedSlippage={suggestedSlippage}
          showWarning={!!zapInfo}
        />

        <div className="flex justify-between items-start mt-3 text-xs">
          <MouseoverTooltip
            text="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
            width="220px"
          >
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
          </MouseoverTooltip>
          {initializing ? (
            <Skeleton className="w-14 h-4" />
          ) : zapInfo ? (
            <div
              className={
                zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                  ? 'text-error'
                  : zapImpact.level === PI_LEVEL.HIGH
                    ? 'text-warning'
                    : 'text-text'
              }
            >
              {zapImpact.display}
            </div>
          ) : (
            '--'
          )}
        </div>
      </div>

      {zapInfo && isHighRemainingAmount && (
        <div
          className="rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] text-warning"
          style={{ background: `${theme.warning}33` }}
        >
          {((refundInfo.refundUsd * 100) / initUsd).toFixed(2)}% remains unused and will be returned to your wallet.
          Refresh or change your amount to get updated routes.
        </div>
      )}

      {zapInfo && swapPriceImpact.piRes.level !== PI_LEVEL.NORMAL && (
        <div
          className={`rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] ${
            swapPriceImpact.piRes.level === PI_LEVEL.HIGH ? 'text-warning' : 'text-error'
          }`}
          style={{
            backgroundColor: swapPriceImpact.piRes.level === PI_LEVEL.HIGH ? `${theme.warning}33` : `${theme.error}33`,
          }}
        >
          {swapPriceImpact.piRes.msg}
        </div>
      )}

      {zapInfo && zapImpact.level !== PI_LEVEL.NORMAL && (
        <div
          className={`rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] ${
            zapImpact.level === PI_LEVEL.HIGH ? 'text-warning' : 'text-error'
          }`}
          style={{
            backgroundColor: zapImpact.level === PI_LEVEL.HIGH ? `${theme.warning}33` : `${theme.error}33`,
          }}
        >
          {zapImpact.msg}
        </div>
      )}
    </>
  );
}
