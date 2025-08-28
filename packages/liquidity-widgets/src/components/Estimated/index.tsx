import { useShallow } from 'zustand/shallow';

import { API_URLS } from '@kyber/schema';
import { InfoHelper } from '@kyber/ui';
import { PI_LEVEL } from '@kyber/utils';
import { formatCurrency } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import EstimatedRow from '@/components/Estimated/EstimatedRow';
import EstimatedTokenRow from '@/components/Estimated/EstimatedTokenRow';
import SlippageRow from '@/components/Estimated/SlippageRow';
import SwapImpactCollapse from '@/components/Estimated/SwapImpactCollapse';
import WarningMessage from '@/components/Estimated/WarningMessage';
import useEstimated from '@/components/Estimated/useEstimated';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function Estimated() {
  const { source, positionId } = useWidgetStore(
    useShallow(s => ({
      source: s.source,
      positionId: s.positionId,
    })),
  );
  const {
    initializing,
    token0,
    token1,
    zapInfo,
    positionAmountInfo,
    addedAmountInfo,
    isHighRemainingAmount,
    refundInfo,
    initUsd,
    suggestedSlippage,
    swapActions,
    swapPriceImpact,
    zapImpact,
    feeInfo,
  } = useEstimated();

  const addedValue = !!positionAmountInfo.addedAmountUsd && (
    <span>{formatCurrency(positionAmountInfo.addedAmountUsd)}</span>
  );

  const remainingAmountWarning = zapInfo && isHighRemainingAmount && (
    <WarningMessage
      isWarning
      message={`${((refundInfo.refundUsd * 100) / initUsd).toFixed(2)}% remains unused and will be returned to your wallet. Refresh or change your amount to get updated routes.`}
    />
  );
  const swapPriceImpactWarning = zapInfo && swapPriceImpact.piRes.level !== PI_LEVEL.NORMAL && (
    <WarningMessage isWarning={swapPriceImpact.piRes.level === PI_LEVEL.HIGH} message={swapPriceImpact.piRes.msg} />
  );
  const zapImpactWarning = zapInfo && zapImpact.level !== PI_LEVEL.NORMAL && (
    <WarningMessage isWarning={zapImpact.level === PI_LEVEL.HIGH} message={zapImpact.msg} />
  );

  return (
    <>
      <div className="border border-stroke rounded-md py-3 px-4">
        <div className="text-sm mb-1 flex justify-between">
          Est. Liquidity Value
          {addedValue}
        </div>
        <div className="ks-lw-divider" />

        <EstimatedTokenRow
          initializing={initializing}
          token={token0}
          addedAmount={addedAmountInfo.addedAmount0}
          addedValue={addedAmountInfo.addedAmount0Usd}
          previousAmount={positionId ? positionAmountInfo.amount0 : undefined}
          previousValue={positionId ? positionAmountInfo.positionAmount0Usd : undefined}
        />

        <EstimatedTokenRow
          initializing={initializing}
          token={token1}
          addedAmount={addedAmountInfo.addedAmount1}
          addedValue={addedAmountInfo.addedAmount1Usd}
          previousAmount={positionId ? positionAmountInfo.amount1 : undefined}
          previousValue={positionId ? positionAmountInfo.positionAmount1Usd : undefined}
        />

        <EstimatedRow
          initializing={initializing}
          label="Est. Remaining Value"
          labelTooltip="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
          value={
            <div>
              {formatCurrency(refundInfo.refundUsd)}
              {refundInfo.refundAmount0 || refundInfo.refundAmount1 ? (
                <InfoHelper
                  text={
                    <div>
                      <div>
                        {refundInfo.refundAmount0} {token0.symbol}
                      </div>
                      <div>
                        {refundInfo.refundAmount1} {token1.symbol}
                      </div>
                    </div>
                  }
                />
              ) : null}
            </div>
          }
          hasRoute={!!zapInfo}
        />

        <SwapImpactCollapse initializing={initializing} swapActions={swapActions} swapPriceImpact={swapPriceImpact} />

        <SlippageRow suggestedSlippage={suggestedSlippage} />

        <EstimatedRow
          initializing={initializing}
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
          }
          hasRoute={!!zapInfo}
        />

        <EstimatedRow
          initializing={initializing}
          label="Zap Fee"
          labelTooltip={
            <div>
              Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas fees.{' '}
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
          value={<div>{parseFloat((feeInfo.protocolFee + feeInfo.partnerFee).toFixed(3)) + '%'}</div>}
          valueTooltip={
            feeInfo.partnerFee
              ? `${parseFloat(feeInfo.protocolFee.toFixed(3))}% Protocol Fee + ${parseFloat(
                  feeInfo.partnerFee.toFixed(3),
                )}% Fee for ${source}`
              : undefined
          }
          hasRoute={!!zapInfo}
        />
      </div>

      {remainingAmountWarning}
      {swapPriceImpactWarning}
      {zapImpactWarning}
    </>
  );
}
