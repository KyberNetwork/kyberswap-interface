import { API_URLS, univ2Types } from '@kyber/schema';
import { InfoHelper } from '@kyber/ui';
import { PI_LEVEL } from '@kyber/utils';
import { formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import EstimatedRow from '@/components/Estimated/EstimatedRow';
import { HIGH_SLIPPAGE_WARNING, LOW_SLIPPAGE_WARNING } from '@/components/Warning/SlippageWarning';
import useZapRoute from '@/hooks/useZapRoute';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function Estimated() {
  const { targetPoolType } = useWidgetStore(['targetPoolType']);
  const { slippage, route, buildData } = useZapStore(['slippage', 'route', 'buildData']);
  const { zapImpact, suggestedSlippage, zapFee, refund } = useZapRoute();

  const isTargetUniV2 = univ2Types.includes(targetPoolType as any);

  if (!route || !buildData) return null;

  return (
    <div className="flex flex-col gap-2 mt-4">
      {!isTargetUniV2 ? (
        <EstimatedRow
          label="Remaining amount"
          labelTooltip="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
          value={
            refund.refunds.length > 0 ? (
              <div>
                {formatDisplayNumber(refund.value, { style: 'currency' })}
                <InfoHelper
                  text={
                    <div>
                      {refund.refunds.map(refundItem => (
                        <div key={refundItem.symbol}>
                          {refundItem.amount} {refundItem.symbol}
                        </div>
                      ))}
                    </div>
                  }
                />
              </div>
            ) : (
              <div>--</div>
            )
          }
          hasRoute
        />
      ) : null}

      <EstimatedRow
        label={
          <div
            className={cn(
              'text-subText text-xs border-b border-dotted border-subText',
              slippage && (slippage > 2 * suggestedSlippage || slippage < suggestedSlippage / 2)
                ? 'text-warning border-warning'
                : '',
            )}
          >
            Max Slippage
          </div>
        }
        labelTooltip="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
        valueTooltip={
          slippage && slippage > 2 * suggestedSlippage
            ? HIGH_SLIPPAGE_WARNING
            : slippage && slippage < suggestedSlippage / 2
              ? LOW_SLIPPAGE_WARNING
              : ''
        }
        value={
          <div
            className={cn(
              'text-sm',
              slippage && (slippage > 2 * suggestedSlippage || slippage < suggestedSlippage / 2)
                ? 'text-warning border-b border-warning border-dotted'
                : 'text-text',
            )}
          >
            {slippage ? ((slippage * 100) / 10_000).toFixed(2) : ''}%
          </div>
        }
        hasRoute
      />

      <EstimatedRow
        label={
          <div
            className={cn(
              'text-subText w-fit border-b border-dotted border-subText text-xs',
              route
                ? zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                  ? 'text-error border-error'
                  : zapImpact.level === PI_LEVEL.HIGH
                    ? 'text-warning border-warning'
                    : 'text-subText border-subText'
                : '',
            )}
          >
            Zap Impact
          </div>
        }
        labelTooltip="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
        value={
          <div
            className={`text-sm ${
              zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                ? 'text-error'
                : zapImpact.level === PI_LEVEL.HIGH
                  ? 'text-warning'
                  : 'text-text'
            }`}
          >
            {zapImpact.display}
          </div>
        }
        hasRoute
      />

      <EstimatedRow
        label="Est. Gas Fee"
        labelTooltip={'Estimated network fee for your transaction.'}
        value={<div className="text-sm">{formatDisplayNumber(buildData.gasUsd, { style: 'currency' })}</div>}
        hasRoute
      />

      <EstimatedRow
        label="Migration Fee"
        labelTooltip={
          <div>
            Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas fees.{' '}
            <a className="text-accent" href={API_URLS.DOCUMENT.ZAP_FEE_MODEL} target="_blank" rel="noopener noreferrer">
              More details.
            </a>
          </div>
        }
        value={<div className="text-sm">{parseFloat(zapFee.toFixed(3))}%</div>}
        hasRoute
      />
    </div>
  );
}
