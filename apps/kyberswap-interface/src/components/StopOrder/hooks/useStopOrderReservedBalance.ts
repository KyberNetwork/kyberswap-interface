import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetStopOrderActiveMakingAmountQuery } from 'services/stopOrder'

import { hasReservedBalanceShortfall, parseRawAmount } from 'components/StopOrder/utils'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'

type Props = {
  chainId: ChainId
  currencyIn?: Currency
  parsedInputAmount?: CurrencyAmount<Currency>
}

/**
 * Whether placing this order would leave less of the sell token than the wallet's open stop orders on
 * it already claim — the same check the service makes at create. Open limit orders are left out on
 * purpose: pairing a limit take-profit with a stop on the same tokens, of which only one is meant to
 * fill, is an ordinary way to use both. A native sell is wrapped on placement, so its own amount is not
 * deducted: the wrapped balance already held is what has to keep covering the existing orders.
 */
export const useStopOrderReservedBalance = ({ chainId, currencyIn, parsedInputAmount }: Props): boolean => {
  const { account } = useActiveWeb3React()
  const makingCurrency = useMemo(
    () => (currencyIn ? (currencyIn.isNative ? WETH[chainId] : currencyIn.wrapped) : undefined),
    [chainId, currencyIn],
  )
  const balance = useCurrencyBalance(makingCurrency, chainId)

  const { data: reservedRaw } = useGetStopOrderActiveMakingAmountQuery(
    { chainId, userWallet: account || '', tokenIn: makingCurrency?.address ?? '' },
    { skip: !account || !makingCurrency },
  )

  return useMemo(() => {
    if (!currencyIn || !makingCurrency || !parsedInputAmount || !balance?.currency.equals(makingCurrency)) {
      return false
    }
    const held = BigInt(balance.quotient.toString())
    const remaining = currencyIn.isNative ? held : held - BigInt(parsedInputAmount.quotient.toString())
    return hasReservedBalanceShortfall(remaining, parseRawAmount(reservedRaw))
  }, [currencyIn, makingCurrency, parsedInputAmount, balance, reservedRaw])
}
