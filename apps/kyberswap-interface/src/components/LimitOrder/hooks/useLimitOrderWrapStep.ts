import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { NativeCurrencies } from 'constants/tokens'
import useWrapCallback from 'hooks/useWrapCallback'
import { useCurrencyBalance } from 'state/wallet/hooks'

type UseLimitOrderWrapStepProps = {
  chainId: ChainId
  currency?: Currency
  amount?: CurrencyAmount<Currency>
  balance?: CurrencyAmount<Currency>
}

export const useLimitOrderWrapStep = ({ chainId, currency, amount, balance }: UseLimitOrderWrapStepProps) => {
  const nativeCurrency = NativeCurrencies[chainId]
  const nativeBalance = useCurrencyBalance(nativeCurrency, chainId)
  const isWrappedNativeCurrency = !!currency?.equals(WETH[chainId])

  const wrapAmount = useMemo(() => {
    if (!currency || !isWrappedNativeCurrency || !amount || !balance?.currency.equals(currency)) {
      return undefined
    }
    if (!balance.lessThan(amount)) return undefined
    return CurrencyAmount.fromRawAmount(nativeCurrency, JSBI.subtract(amount.quotient, balance.quotient))
  }, [amount, balance, currency, isWrappedNativeCurrency, nativeCurrency])

  const insufficientBalance = (() => {
    if (!amount) return false
    if (!balance?.currency.equals(amount.currency)) return false
    if (!balance.lessThan(amount)) return false
    if (!isWrappedNativeCurrency || !wrapAmount || !nativeBalance?.currency.equals(nativeCurrency)) return true
    return nativeBalance.lessThan(wrapAmount)
  })()

  const { execute: onWrap } = useWrapCallback(
    wrapAmount ? nativeCurrency : undefined,
    WETH[chainId],
    wrapAmount?.toExact(),
    true,
    chainId,
  )

  return {
    insufficientBalance,
    onWrap,
    wrapAmount,
  }
}
