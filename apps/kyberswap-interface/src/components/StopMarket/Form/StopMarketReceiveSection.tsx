import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

import CurrencyInputPanel from 'components/CurrencyInputPanel'

type Props = {
  sellCurrency?: Currency
  receiveCurrency?: Currency
  outputAmount: string
  estimatedUsd?: string
  onChangeOutput: (output: string) => void
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
 * The amount the trigger price yields for the sell amount, and the other side of it: typing an amount
 * sets the trigger to that amount per unit sold. It is not a floor the order guarantees — the fill
 * tracks the oracle price at execution.
 */
const StopMarketReceiveSection = ({
  sellCurrency,
  receiveCurrency,
  outputAmount,
  estimatedUsd,
  onChangeOutput,
  onSelectCurrency,
  warning,
  selectClassName,
}: Props) => (
  <div data-testid="stop-market-receive-section">
    <CurrencyInputPanel
      id="stop-market-receive-token"
      dataTestId="stop-market-receive-token"
      maxLength={16}
      value={outputAmount}
      onUserInput={onChangeOutput}
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
