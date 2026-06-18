import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { tryParseAmount } from 'state/swap/hooks'

export const useValidateInputError = ({
  inputAmount,
  outputAmount,
  displayRate,
  currencyIn,
  currencyOut,
}: {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  displayRate: string
  inputAmount: string
  outputAmount: string
}) => {
  const { account } = useActiveWeb3React()
  const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
  const inputError = useMemo(() => {
    try {
      if (!account) return
      if (parseFloat(inputAmount) === 0 && (parseFloat(outputAmount) === 0 || parseFloat(displayRate) === 0)) {
        return t`Invalid input amount`
      }
      if (!parseInputAmount) {
        return t`Your input amount is invalid.`
      }
      return
    } catch (error) {
      return
    }
  }, [inputAmount, outputAmount, displayRate, parseInputAmount, account])

  const outPutError = useMemo(() => {
    if (outputAmount && !tryParseAmount(outputAmount, currencyOut)) {
      return t`Your output amount is invalid.`
    }
    return
  }, [outputAmount, currencyOut])
  return { inputError, outPutError }
}
