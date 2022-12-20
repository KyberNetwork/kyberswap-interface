import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { BAD_RECIPIENT_ADDRESSES } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { AppState } from 'state'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency, useSwapState } from 'state/swap/hooks'
import useParsedAmountFromInputCurrency from 'state/swap/hooks/useParsedAmountFromInputCurrency'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { isAddress } from 'utils'

import { toCurrencyAmount } from './computeSlippage'

const useGetError = (): string | undefined => {
  const { account, chainId } = useActiveWeb3React()

  const { typedValue, recipient } = useSwapState()

  const inputCurrency = useInputCurrency()
  const outputCurrency = useOutputCurrency()
  const routeSummary = useSelector((state: AppState) => state.swap.routeSummary)
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null || recipient === '' ? account : recipientLookup.address) ?? null

  const [balanceInput] = useCurrencyBalances(
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency]),
  )
  const parsedAmount = useParsedAmountFromInputCurrency()

  const currencies: { [field in Field]?: Currency } = useMemo(() => {
    return {
      [Field.INPUT]: inputCurrency ?? undefined,
      [Field.OUTPUT]: outputCurrency ?? undefined,
    }
  }, [inputCurrency, outputCurrency])

  let inputError: string | undefined
  if (!account) {
    inputError = t`Connect wallet`
  }

  if (!parsedAmount) {
    if (typedValue) inputError = inputError ?? t`Invalid amount`
    else inputError = inputError ?? t`Enter an amount`
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? t`Select a token`
  }

  const formattedTo = isAddress(chainId, to)
  if (!to || !formattedTo) {
    inputError = inputError ?? t`Enter a recipient`
  } else {
    if (BAD_RECIPIENT_ADDRESSES.indexOf(formattedTo) !== -1) {
      inputError = inputError ?? t`Invalid recipient`
    }
  }

  const amountIn =
    inputCurrency && routeSummary?.amountIn ? toCurrencyAmount(inputCurrency, routeSummary.amountIn) : undefined
  if (amountIn && ((balanceInput && balanceInput.lessThan(amountIn)) || !balanceInput)) {
    inputError = t`Insufficient ${amountIn.currency.symbol} balance`
  }

  return inputError
}

export default useGetError
