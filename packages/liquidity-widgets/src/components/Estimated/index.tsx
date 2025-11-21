import { Trans, t } from '@lingui/macro';

import { API_URLS, defaultToken } from '@kyber/schema';
import { InfoHelper, TokenSymbol, translateZapMessage } from '@kyber/ui';
import { PI_LEVEL } from '@kyber/utils';
import { formatCurrency, formatTokenAmount } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import EstimatedRow from '@/components/Estimated/EstimatedRow';
import EstimatedTokenRow from '@/components/Estimated/EstimatedTokenRow';
import SlippageRow from '@/components/Estimated/SlippageRow';
import WarningMessage from '@/components/Estimated/WarningMessage';
import useZapRoute from '@/hooks/useZapRoute';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function Estimated() {
  const { pool } = usePoolStore(['pool']);
  const { position } = usePositionStore(['position']);
  const { source } = useWidgetStore(['source']);
  const { route } = useZapState();
  const { zapFee, suggestedSlippage, initUsd, refund, zapImpact, addedLiquidity } = useZapRoute();

  const initializing = !pool;
  const { token0 = defaultToken, token1 = defaultToken } = !initializing ? pool : {};

  const addedValue = !!position && (
    <span>
      {+formatTokenAmount(position.amount0, token0.decimals) * (token0.price || 0) +
        +formatTokenAmount(position.amount1, token1.decimals) * (token1.price || 0)}
    </span>
  );

  const isHighRemainingAmount = initUsd ? refund.value / initUsd >= suggestedSlippage / 10_000 : false;
  const remainingAmountWarning = route && isHighRemainingAmount && (
    <WarningMessage
      isWarning
      message={
        <Trans>
          {((refund.value * 100) / initUsd).toFixed(2)}% remains unused and will be returned to your wallet. Refresh or
          change your amount to get updated routes.
        </Trans>
      }
    />
  );
  const zapImpactWarning =
    route && zapImpact.level !== PI_LEVEL.NORMAL ? (
      <WarningMessage isWarning={zapImpact.level === PI_LEVEL.HIGH} message={translateZapMessage(zapImpact.msg)} />
    ) : null;

  return (
    <>
      <div className="border border-stroke rounded-md py-3 px-4">
        <div className="text-sm mb-1 flex justify-between">
          <Trans>Est. Liquidity Value</Trans>
          {addedValue}
        </div>
        <div className="h-[1px] w-full bg-stroke" />

        <EstimatedTokenRow
          initializing={initializing}
          token={token0}
          addedAmount={+formatTokenAmount(addedLiquidity.addedAmount0, token0.decimals)}
          addedValue={addedLiquidity.addedValue0}
          previousAmount={position ? +formatTokenAmount(position.amount0, token0.decimals) : undefined}
          previousValue={
            position ? +formatTokenAmount(position.amount0, token0.decimals) * (token0.price || 0) : undefined
          }
        />

        <EstimatedTokenRow
          initializing={initializing}
          token={token1}
          addedAmount={+formatTokenAmount(addedLiquidity.addedAmount1, token1.decimals)}
          addedValue={addedLiquidity.addedValue1}
          previousAmount={position ? +formatTokenAmount(position.amount1, token1.decimals) : undefined}
          previousValue={
            position ? +formatTokenAmount(position.amount1, token1.decimals) * (token1.price || 0) : undefined
          }
        />

        <EstimatedRow
          initializing={initializing}
          label={t`Est. Remaining Value`}
          labelTooltip={t`Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet.`}
          value={
            <div>
              {formatCurrency(refund.value)}
              {refund.refunds.length > 0 ? (
                <InfoHelper
                  text={
                    <div>
                      {refund.refunds.map(item => (
                        <div key={item.symbol}>
                          {item.amount} <TokenSymbol symbol={item.symbol} maxWidth={80} />
                        </div>
                      ))}
                    </div>
                  }
                />
              ) : null}
            </div>
          }
          hasRoute={!!route}
        />

        <SlippageRow suggestedSlippage={suggestedSlippage} />

        <EstimatedRow
          initializing={initializing}
          label={
            <div
              className={cn(
                'text-subText mt-[2px] w-fit border-b border-dotted border-subText',
                route
                  ? zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                    ? 'border-error text-error'
                    : zapImpact.level === PI_LEVEL.HIGH
                      ? 'border-warning text-warning'
                      : 'border-subText'
                  : '',
              )}
            >
              <Trans>Zap Impact</Trans>
            </div>
          }
          labelTooltip={t`The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!`}
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
          hasRoute={!!route}
        />

        <EstimatedRow
          initializing={initializing}
          label={t`Zap Fee`}
          labelTooltip={
            <Trans>
              Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas fees.{' '}
              <a
                className="text-accent"
                href={API_URLS.DOCUMENT.ZAP_FEE_MODEL}
                target="_blank"
                rel="noopener norefferer noreferrer"
              >
                More details.
              </a>
            </Trans>
          }
          value={<div>{parseFloat((zapFee.protocolFee + zapFee.partnerFee).toFixed(3)) + '%'}</div>}
          valueTooltip={
            zapFee.partnerFee ? (
              <Trans>
                {parseFloat(zapFee.protocolFee.toFixed(3))}% Protocol Fee + {parseFloat(zapFee.partnerFee.toFixed(3))}%
                Fee for {source}
              </Trans>
            ) : undefined
          }
          hasRoute={!!route}
        />
      </div>

      {remainingAmountWarning}
      {zapImpactWarning}
    </>
  );
}
