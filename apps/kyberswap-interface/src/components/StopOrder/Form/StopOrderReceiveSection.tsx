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
  /**
   * Shown above the estimate note when the receive token cannot be used. As a function it is handed a
   * callback that opens the receive token selector.
   */
  warning?: ReactNode | ((openTokenSelector: () => void) => ReactNode)
  /** Extra classes for the token button, e.g. to flag a token that cannot be used here. */
  selectClassName?: string
}

/**
 * Output is decided at execution, so the amount is read-only: it shows what the trigger price would
 * yield, not a floor the order guarantees.
 */
const StopOrderReceiveSection = ({
  sellCurrency,
  receiveCurrency,
  estimatedOutput,
  estimatedUsd,
  triggerPrice,
  onSelectCurrency,
  warning,
  selectClassName,
}: Props) => (
  <div data-testid="stop-order-receive-section">
    <CurrencyInputPanel
      id="stop-order-receive-token"
      dataTestId="stop-order-receive-token"
      value={estimatedOutput ? `~${estimatedOutput}` : ''}
      readOnlyInput
      selectClassName={selectClassName}
      currency={receiveCurrency}
      otherCurrency={sellCurrency}
      onCurrencySelect={onSelectCurrency}
      estimatedUsd={estimatedUsd}
      positionMax="top"
      positionLabel="in"
      showPinnedTokens
      maxCurrencySymbolLength={6}
      filterWrap
      // The trigger prices the sell token in this one, so the receive side needs an oracle feed too.
      requireOracle
      label={
        <div className="text-xs font-medium text-subText">
          <Trans>You Receive</Trans>
        </div>
      }
      // The note qualifies this figure, so it belongs in the same box rather than floating under it.
      footer={openTokenSelector => (
        <Stack className="gap-1.5">
          {typeof warning === 'function' ? warning(openTokenSelector) : warning}
          <span className="text-xs font-medium text-subText" data-testid="stop-order-receive-note">
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
      )}
    />
  </div>
)

export default StopOrderReceiveSection
