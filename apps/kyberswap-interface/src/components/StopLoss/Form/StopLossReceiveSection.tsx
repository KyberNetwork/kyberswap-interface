import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Stack } from 'components/Stack'

type Props = {
  sellCurrency?: Currency
  receiveCurrency?: Currency
  estimatedOutput: string
  estimatedUsd?: string
  triggerPrice: string
  onSelectCurrency?: (currency: Currency) => void
  /** Shown above the estimate note when the receive token itself cannot be monitored. */
  warning?: ReactNode
}

/**
 * Output is decided at execution, so the amount is read-only: it shows what the trigger price would
 * yield, not a floor the order guarantees.
 */
const StopLossReceiveSection = ({
  sellCurrency,
  receiveCurrency,
  estimatedOutput,
  estimatedUsd,
  triggerPrice,
  onSelectCurrency,
  warning,
}: Props) => (
  <div data-testid="stop-loss-receive-section">
    <CurrencyInputPanel
      id="stop-loss-receive-token"
      dataTestId="stop-loss-receive-token"
      value={estimatedOutput ? `~${estimatedOutput}` : ''}
      disabledInput
      currency={receiveCurrency}
      otherCurrency={sellCurrency}
      onCurrencySelect={onSelectCurrency}
      estimatedUsd={estimatedUsd}
      positionMax="top"
      positionLabel="in"
      showPinnedTokens
      maxCurrencySymbolLength={6}
      filterWrap
      label={
        <div className="text-xs font-medium text-subText">
          <Trans>You Receive</Trans>
        </div>
      }
      // The note qualifies this figure, so it belongs in the same box rather than floating under it.
      footer={
        <Stack className="gap-1.5">
          {warning}
          <span className="text-xs font-medium italic text-text-60" data-testid="stop-loss-receive-note">
            {triggerPrice ? (
              <Trans>
                Estimated at your {triggerPrice} {receiveCurrency?.symbol} trigger. Actual amount depends on market
                conditions at trigger time.
              </Trans>
            ) : (
              <Trans>Set a trigger price to see your estimated output.</Trans>
            )}
          </span>
        </Stack>
      }
    />
  </div>
)

export default StopLossReceiveSection
