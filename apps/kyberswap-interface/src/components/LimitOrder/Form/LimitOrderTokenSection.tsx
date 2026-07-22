import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

import CurrencyInputPanel from 'components/CurrencyInputPanel'

const Label = ({ children }: { children: ReactNode }) => (
  <div className="text-xs font-medium text-subText">{children}</div>
)

export type LimitOrderTokenPanelProps = {
  chainId?: number
  tokens?: TokenSectionTokens
  estimateUsd?: TokenSectionEstimateUsd
  events?: TokenSectionEvents
}

type TokenSectionTokens = {
  currencyIn?: Currency
  currencyOut?: Currency
  inputAmount?: string
  outputAmount?: string
}

type TokenSectionEstimateUsd = {
  input: string | undefined
  output: string | undefined
}

type TokenSectionEvents = {
  onInputAmountChange?: (input: string) => void
  onOutputAmountChange?: (output: string) => void
  onMaxInput?: () => void
  onHalfInput?: () => void
  onInputTokenSelect?: (currency: Currency) => void
  onOutputTokenSelect?: (currency: Currency) => void
  onInputFocus?: () => void
  onTokenSelectorOpen?: () => void
}

const DEFAULT_ESTIMATE_USD: TokenSectionEstimateUsd = { input: undefined, output: undefined }

export const LimitOrderInputTokenPanel = ({
  chainId,
  tokens = {},
  estimateUsd = DEFAULT_ESTIMATE_USD,
  events = {},
}: LimitOrderTokenPanelProps) => {
  const { currencyIn, currencyOut, inputAmount = '' } = tokens

  return (
    <CurrencyInputPanel
      value={inputAmount}
      positionMax="top"
      onUserInput={events.onInputAmountChange}
      onMax={events.onMaxInput}
      onHalf={events.onHalfInput}
      otherCurrency={currencyOut}
      estimatedUsd={estimateUsd.input}
      onFocus={events.onInputFocus}
      onCurrencySelect={events.onInputTokenSelect}
      currency={currencyIn}
      showPinnedTokens
      id="create-limit-order-input-tokena"
      dataTestId="limit-order-input-tokena"
      maxCurrencySymbolLength={6}
      filterWrap
      onClickSelect={events.onTokenSelectorOpen}
      label={
        <Label>
          <Trans>You Sell</Trans>
        </Label>
      }
      positionLabel="in"
      customChainId={chainId}
      trackingSource="limit_order"
    />
  )
}

export const LimitOrderOutputTokenPanel = ({
  chainId,
  tokens = {},
  estimateUsd = DEFAULT_ESTIMATE_USD,
  events = {},
}: LimitOrderTokenPanelProps) => {
  const { currencyIn, currencyOut, outputAmount = '' } = tokens

  return (
    <CurrencyInputPanel
      maxLength={16}
      value={outputAmount}
      currency={currencyOut}
      onUserInput={events.onOutputAmountChange}
      otherCurrency={currencyIn}
      estimatedUsd={estimateUsd.output}
      onFocus={events.onInputFocus}
      id="create-limit-order-input-tokenb"
      dataTestId="limit-order-input-tokenb"
      onCurrencySelect={events.onOutputTokenSelect}
      positionMax="top"
      showPinnedTokens
      maxCurrencySymbolLength={6}
      filterWrap
      onClickSelect={events.onTokenSelectorOpen}
      label={
        <Label>
          <Trans>You Buy</Trans>
        </Label>
      }
      positionLabel="in"
      customChainId={chainId}
      trackingSource="limit_order"
    />
  )
}
