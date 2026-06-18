import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useLimitActionHandlers } from 'state/limit/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { formatDisplayNumber } from 'utils/numbers'

const useValidateInputError = ({
  inputAmount,
  outputAmount,
  balance,
  displayRate,
  parsedActiveOrderMakingAmount,
  currencyIn,
  wrapInputError,
  showWrap,
  currencyOut,
  showInsufficientBalanceError = true,
}: {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  showWrap: boolean
  wrapInputError: any
  showInsufficientBalanceError?: boolean
  displayRate: string
  inputAmount: string
  outputAmount: string
  parsedActiveOrderMakingAmount: CurrencyAmount<Currency> | undefined
  balance: CurrencyAmount<Currency> | undefined
}) => {
  const { account } = useActiveWeb3React()
  const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
  const { setInputValue } = useLimitActionHandlers()
  const inputError = useMemo(() => {
    try {
      if (!account) return
      if (parseFloat(inputAmount) === 0 && (parseFloat(outputAmount) === 0 || parseFloat(displayRate) === 0)) {
        return t`Invalid input amount`
      }
      if (showInsufficientBalanceError && balance && parseInputAmount?.greaterThan(balance)) {
        const symbol = currencyIn?.symbol
        return t`Insufficient ${symbol} balance`
      }

      const remainBalance = parsedActiveOrderMakingAmount ? balance?.subtract(parsedActiveOrderMakingAmount) : undefined
      if (showInsufficientBalanceError && parseInputAmount && remainBalance?.lessThan(parseInputAmount)) {
        const formatNum = formatDisplayNumber(remainBalance, {
          style: 'decimal',
          fractionDigits: 6,
          allowDisplayNegative: true,
        })
        return (
          <span className="cursor-pointer">
            <Trans>
              Insufficient {currencyIn?.symbol} balance.
              <br />
              <b className="text-primary" onClick={() => setInputValue(remainBalance.toExact())}>
                {!remainBalance.equalTo(JSBI.BigInt(0)) ? '~' : ''}
                {formatNum} {currencyIn?.symbol}
              </b>{' '}
              remaining after deducting Active and Open orders.
            </Trans>
          </span>
        )
      }

      if (!parseInputAmount) {
        return t`Your input amount is invalid.`
      }

      if (showInsufficientBalanceError && showWrap && wrapInputError) return wrapInputError
      return
    } catch (error) {
      return
    }
  }, [
    currencyIn,
    balance,
    inputAmount,
    outputAmount,
    displayRate,
    parsedActiveOrderMakingAmount,
    parseInputAmount,
    showWrap,
    wrapInputError,
    setInputValue,
    account,
    showInsufficientBalanceError,
  ])

  const outPutError = useMemo(() => {
    if (outputAmount && !tryParseAmount(outputAmount, currencyOut)) {
      return t`Your output amount is invalid.`
    }
    return
  }, [outputAmount, currencyOut])
  return { inputError, outPutError }
}
export default useValidateInputError
