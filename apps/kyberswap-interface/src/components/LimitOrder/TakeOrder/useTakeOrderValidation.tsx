import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

import { formatExact, isExceedsAvailableAmount, normalizeActionAmount } from 'components/LimitOrder/TakeOrder/utils'

type Props = {
  fillAmount: string
  insufficientBalance: boolean
  maxPayAmount?: CurrencyAmount<Currency>
  payCurrency: Currency
  parsedPayAmount?: CurrencyAmount<Currency>
  wrapAmount?: CurrencyAmount<Currency>
  onFillAmountChange: (amount: string) => void
}

type TakeOrderValidation = {
  fillAmountMessage: ReactNode
  primaryActionMessage: ReactNode
}

export const useTakeOrderValidation = ({
  fillAmount,
  insufficientBalance,
  maxPayAmount,
  payCurrency,
  parsedPayAmount,
  wrapAmount,
  onFillAmountChange,
}: Props): TakeOrderValidation => {
  const isFillAmountEmpty = fillAmount.trim() === ''
  const exceedsAvailableAmount = isExceedsAvailableAmount(parsedPayAmount, maxPayAmount)

  const inputErrorMessage = (() => {
    if (isFillAmountEmpty) return <Trans>Enter an amount</Trans>
    if (insufficientBalance) return <Trans>Insufficient {payCurrency.symbol} balance</Trans>
    return null
  })()
  const primaryActionMessage = inputErrorMessage || (exceedsAvailableAmount ? <Trans>Exceeds available</Trans> : null)

  const fillAmountMessage = (() => {
    if (inputErrorMessage) {
      return inputErrorMessage
    }
    if (exceedsAvailableAmount) {
      return (
        <Trans>
          Max fill:{' '}
          <button
            type="button"
            className="border-none bg-transparent p-0 italic text-text hover:brightness-[0.85]"
            onClick={() => onFillAmountChange(normalizeActionAmount(maxPayAmount?.toExact() || ''))}
          >
            {formatExact(maxPayAmount)} {payCurrency.symbol}
          </button>{' '}
          at this rate
        </Trans>
      )
    }
    if (wrapAmount) {
      return (
        <Trans>
          You need to wrap{' '}
          <span className="text-text">
            {formatExact(wrapAmount)} {wrapAmount.currency.symbol}
          </span>{' '}
          before filling this order
        </Trans>
      )
    }
    return null
  })()

  return { fillAmountMessage, primaryActionMessage }
}
