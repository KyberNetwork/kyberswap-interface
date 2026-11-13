import type { Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ButtonPrimary } from 'components/Button'
import { CurrencyInputPanelView } from 'components/CurrencyInputPanel'
import { Aligner, CurrencySelect, StyledTokenName } from 'components/CurrencyInputPanel/CurrencySelect'
import CurrencyLogo from 'components/CurrencyLogo'
import Skeleton from 'components/Skeleton'
import { HStack } from 'components/Stack'
import { PendingCrossChainQuoteDetails } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteLayout'
import { SwapFormLayout } from 'components/SwapForm/SwapFormLayout'
import { NETWORKS_INFO } from 'constants/networks'
import { type Chain, type Currency, NonEvmChain, NonEvmChainInfo } from 'types/crossChain'

type Props = {
  currencyIn?: EvmCurrency
  currencyOut?: EvmCurrency
  inputChain: Chain
  outputChain: Chain
  amount: string
}

export const PendingWalletSelector = () => (
  <div className="-my-1 -ml-2 flex h-7 items-center px-2">
    <Skeleton width={100} height={16} />
  </div>
)

export const PendingCurrencyPanel = ({
  chain,
  currency,
  value,
  output = false,
}: {
  chain: Chain
  currency?: Currency
  value: string
  output?: boolean
}) => {
  const network = typeof chain === 'number' ? NETWORKS_INFO[chain] : NonEvmChainInfo[chain]
  const symbol = currency?.symbol ?? (chain === NonEvmChain.Bitcoin ? 'BTC' : undefined)

  return (
    <div inert aria-busy="true">
      <CurrencyInputPanelView
        id={output ? 'swap-currency-output' : 'swap-currency-input'}
        value={output ? ' ' : value}
        disabledInput
        customBalanceText="--"
        positionLabel="in"
        customCurrencySelect={
          <CurrencySelect selected isDisable>
            <Aligner className="gap-2">
              <HStack className="items-center gap-2">
                <div className="relative shrink-0">
                  {currency ? (
                    'isNative' in currency ? (
                      <CurrencyLogo currency={currency} size="20px" />
                    ) : (
                      <img src={currency.logo} alt={currency.symbol} className="size-5 rounded-full" />
                    )
                  ) : (
                    <Skeleton width={20} height={20} />
                  )}
                  <img
                    src={network.icon}
                    alt={network.name}
                    className="absolute -bottom-1 -right-1 size-3 rounded border border-background"
                  />
                </div>
                <StyledTokenName active>{symbol ?? <Skeleton width={64} height={16} />}</StyledTokenName>
              </HStack>
              <DropdownSVG className="shrink-0" />
            </Aligner>
          </CurrencySelect>
        }
      />
    </div>
  )
}

/** Provider-free UI: no balances, wallet hooks, selectors, tracking or quote requests. */
export const PendingSwapForm = ({ currencyIn, currencyOut, inputChain, outputChain, amount }: Props) => {
  return (
    <fieldset disabled inert aria-busy="true" className="m-0 min-w-0 border-0 p-0">
      <SwapFormLayout
        inputPanel={<PendingCurrencyPanel chain={inputChain} currency={currencyIn} value={amount} />}
        outputPanel={<PendingCurrencyPanel chain={outputChain} currency={currencyOut} value="" output />}
        details={
          <PendingCrossChainQuoteDetails
            showRecipient={typeof inputChain === 'number' && typeof outputChain === 'number'}
          />
        }
        action={
          <ButtonPrimary id="swap-button" disabled>
            <Trans>Swap</Trans>
          </ButtonPrimary>
        }
      />
    </fieldset>
  )
}
