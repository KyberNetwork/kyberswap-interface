import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

import CurrencyInputPanel from 'components/CurrencyInputPanel'

type Props = {
  sellCurrency?: Currency
  receiveCurrency?: Currency
  estimatedOutput: string
  estimatedUsd?: string
  onSelectCurrency?: (currency: Currency) => void
  /**
   * Shown inside the field when the receive token cannot be used. As a function it is handed a callback
   * that opens the receive token selector.
   */
  warning?: ReactNode | ((openTokenSelector: () => void) => ReactNode)
  /** Extra classes for the token button, e.g. to flag a token that cannot be used here. */
  selectClassName?: string
}

/**
 * Output is decided at execution, so the amount is read-only: it shows what the trigger price would
 * yield, not a floor the order guarantees.
 */
const StopMarketReceiveSection = ({
  sellCurrency,
  receiveCurrency,
  estimatedOutput,
  estimatedUsd,
  onSelectCurrency,
  warning,
  selectClassName,
}: Props) => (
  <div data-testid="stop-market-receive-section">
    <CurrencyInputPanel
      id="stop-market-receive-token"
      dataTestId="stop-market-receive-token"
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
      // The trigger prices the sell token in this one, so the receive side needs an oracle feed too.
      requireOracle
      label={
        <div className="text-xs font-medium text-subText">
          <Trans>Amount Out</Trans>
        </div>
      }
      // A warning about the token belongs in the same box as the token, rather than floating under it.
      footer={warning}
    />
  </div>
)

export default StopMarketReceiveSection
