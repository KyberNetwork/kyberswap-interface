import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'
import { useGetStopOrderActiveMakingAmountQuery } from 'services/stopOrder'

import { hasReservedBalanceShortfall, parseRawAmount } from 'components/StopOrder/utils'
import { isSupportLimitOrder } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'

type Props = {
  chainId: ChainId
  currencyIn?: Currency
  parsedInputAmount?: CurrencyAmount<Currency>
}

export type StopOrderReservedBalance = {
  /** Placing the order would leave less than the open orders on this token already claim. */
  hasShortfall: boolean
  /** Which kinds of open order hold a claim, so a notice can point at the right list. */
  reservedByStopOrders: boolean
  reservedByLimitOrders: boolean
}

/**
 * What the wallet's open orders on the sell token already lay claim to, against what placing this
 * order would leave. Stop and limit orders approve different spenders but sell from the one wrapped
 * balance, so both services are asked, and the limit figure is token-wide rather than per pair. A
 * native sell is wrapped on placement, so its own amount is not deducted: the wrapped balance already
 * held is what has to keep covering the existing orders.
 */
export const useStopOrderReservedBalance = ({
  chainId,
  currencyIn,
  parsedInputAmount,
}: Props): StopOrderReservedBalance => {
  const { account } = useActiveWeb3React()
  const makingCurrency = useMemo(
    () => (currencyIn ? (currencyIn.isNative ? WETH[chainId] : currencyIn.wrapped) : undefined),
    [chainId, currencyIn],
  )
  const balance = useCurrencyBalance(makingCurrency, chainId)

  const skip = !account || !makingCurrency
  const { data: stopReservedRaw } = useGetStopOrderActiveMakingAmountQuery(
    { chainId, userWallet: account || '', tokenIn: makingCurrency?.address ?? '' },
    { skip },
  )
  const { data: limitReservedRaw } = useGetTotalActiveMakingAmountQuery(
    { chainId, makerAsset: makingCurrency?.address, account },
    { skip: skip || !isSupportLimitOrder(chainId) },
  )

  return useMemo(() => {
    const stopReserved = parseRawAmount(stopReservedRaw)
    const limitReserved = parseRawAmount(limitReservedRaw)
    const result = {
      hasShortfall: false,
      reservedByStopOrders: stopReserved > 0n,
      reservedByLimitOrders: limitReserved > 0n,
    }
    if (!currencyIn || !makingCurrency || !parsedInputAmount || !balance?.currency.equals(makingCurrency)) {
      return result
    }
    const held = BigInt(balance.quotient.toString())
    const remaining = currencyIn.isNative ? held : held - BigInt(parsedInputAmount.quotient.toString())
    return { ...result, hasShortfall: hasReservedBalanceShortfall(remaining, stopReserved + limitReserved) }
  }, [currencyIn, makingCurrency, parsedInputAmount, balance, stopReservedRaw, limitReservedRaw])
}
