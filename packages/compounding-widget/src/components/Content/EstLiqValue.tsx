import { useShallow } from 'zustand/shallow';

import { API_URLS, defaultToken } from '@kyber/schema';
import { InfoHelper, MouseoverTooltip, Skeleton, TokenLogo } from '@kyber/ui';
import { PI_LEVEL, parseZapInfo } from '@kyber/utils';
import { formatCurrency, formatNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import { SlippageWarning } from '@/components/SlippageWarning';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function EstLiqValue() {
  const { theme, positionId } = useWidgetStore(
    useShallow(s => ({
      theme: s.theme,
      positionId: s.positionId,
    })),
  );
  const { zapInfo, slippage } = useZapState();
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
    feeInfo,
  } = parseZapInfo({ zapInfo, token0, token1, position });

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

        <div className="flex justify-between items-start mt-3 text-xs">
          <MouseoverTooltip
            text={
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
            width="220px"
          >
            <div className="text-subText mt-[2px] w-fit border-b border-dotted border-subText">Zap Fee</div>
          </MouseoverTooltip>

          {initializing ? (
            <Skeleton className="w-14 h-4" />
          ) : (
            <div>{parseFloat(feeInfo.protocolFee.toFixed(3)) + '%'}</div>
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
