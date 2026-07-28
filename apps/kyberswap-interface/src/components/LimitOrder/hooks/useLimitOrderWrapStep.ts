import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'

import { NativeCurrencies } from 'constants/tokens'
import useWrapCallback from 'hooks/useWrapCallback'

type UseLimitOrderWrapStepProps = {
  chainId: ChainId
  amount?: CurrencyAmount<Currency>
  balance?: CurrencyAmount<Currency>
  wrapAmount?: CurrencyAmount<Currency>
}

export const useLimitOrderWrapStep = ({ chainId, amount, balance, wrapAmount }: UseLimitOrderWrapStepProps) => {
  const nativeCurrency = NativeCurrencies[chainId]

  const insufficientBalance = (() => {
    if (!amount) return false
    if (!balance?.currency.equals(amount.currency)) return false
    return balance.lessThan(amount)
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
