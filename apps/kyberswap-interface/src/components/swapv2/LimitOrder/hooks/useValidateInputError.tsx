import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { tryParseAmount } from 'state/swap/hooks'

type UseValidateInputErrorArgs = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  displayRate: string
  inputAmount: string
  outputAmount: string
}

const isZeroAmount = (amount: string) => amount !== '' && Number(amount) === 0

export const useValidateInputError = ({
  inputAmount,
  outputAmount,
  displayRate,
  currencyIn,
  currencyOut,
}: UseValidateInputErrorArgs) => {
  const { account } = useActiveWeb3React()
  const parsedInputAmount = useMemo(
    () => tryParseAmount(inputAmount, currencyIn ?? undefined),
    [currencyIn, inputAmount],
  )
  const parsedOutputAmount = useMemo(
    () => tryParseAmount(outputAmount, currencyOut ?? undefined),
    [currencyOut, outputAmount],
  )

  const inputError = useMemo(() => {
    if (!account) return
    if (isZeroAmount(inputAmount) && (isZeroAmount(outputAmount) || isZeroAmount(displayRate))) {
      return t`Please enter a valid input amount`
    }
    if (!parsedInputAmount) {
      return t`Please enter a valid input amount`
    }
    return
  }, [inputAmount, outputAmount, displayRate, parsedInputAmount, account])

  const outputError = useMemo(() => {
    if (outputAmount && !parsedOutputAmount) {
      return t`Please enter a valid output amount`
    }
    return
  }, [outputAmount, parsedOutputAmount])

  return { inputError, outputError }
}
