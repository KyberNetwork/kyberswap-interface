import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import ReverseTokenSelectionButton from 'components/SwapForm/ReverseTokenSelectionButton'
import Tooltip from 'components/Tooltip'

const Label = ({ children }: { children: ReactNode }) => (
  <div className="text-xs font-medium text-subText">{children}</div>
)

type Props = {
  chainId?: number
  tokens?: TokenSectionTokens
  errors?: TokenSectionErrors
  estimateUsd?: TokenSectionEstimateUsd
  events?: TokenSectionEvents
}

type TokenSectionTokens = {
  currencyIn?: Currency
  currencyOut?: Currency
  inputAmount?: string
  outputAmount?: string
}

type TokenSectionErrors = {
  input: string | ReactNode
  output: string | ReactNode
}

type TokenSectionEstimateUsd = {
  input: string | undefined
  output: string | undefined
}

type TokenSectionEvents = {
  onInputAmountChange?: (input: string) => void
  onOutputAmountChange?: (output: string) => void
  onMaxInput?: () => void
  onInputTokenSelect?: (currency: Currency) => void
  onOutputTokenSelect?: (currency: Currency) => void
  onRotate?: () => void
  onInputFocus?: () => void
  onTokenSelectorOpen?: () => void
}

const DEFAULT_ERRORS: TokenSectionErrors = { input: undefined, output: undefined }
const DEFAULT_ESTIMATE_USD: TokenSectionEstimateUsd = { input: undefined, output: undefined }

const LimitOrderTokenSection = ({
  chainId,
  tokens = {},
  errors = DEFAULT_ERRORS,
  estimateUsd = DEFAULT_ESTIMATE_USD,
  events = {},
}: Props) => {
  const { currencyIn, currencyOut, inputAmount = '', outputAmount = '' } = tokens

  return (
    <div className="relative flex flex-col gap-2">
      <Tooltip text={errors.input} show={!!errors.input} placement="top" width="fit-content" dataTestId="error-message">
        <CurrencyInputPanel
          error={!!errors.input}
          value={inputAmount}
          positionMax="top"
          onUserInput={events.onInputAmountChange}
          onMax={events.onMaxInput}
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
      </Tooltip>

      <ReverseTokenSelectionButton className="z-20 -my-4" onClick={() => events.onRotate?.()} />

      <Tooltip text={errors.output} show={!!errors.output} placement="top" width="fit-content">
        <CurrencyInputPanel
          maxLength={16}
          value={outputAmount}
          error={!!errors.output}
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
      </Tooltip>
    </div>
  )
}

export default LimitOrderTokenSection
