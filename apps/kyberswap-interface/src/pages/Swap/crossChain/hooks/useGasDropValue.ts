import { ChainId } from '@kyberswap/ks-sdk-core'
import { formatUnits } from 'viem'

import { NativeCurrencies } from 'constants/tokens'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { Chain, GasDropQuote } from 'types/crossChain'

export const useGasDropValue = (gasDrop: GasDropQuote | undefined, chain: Chain) => {
  const native = NativeCurrencies[chain as ChainId]
  const priceAddress = native?.wrapped.address.toLowerCase()
  const prices = useTokenPrices(
    gasDrop && gasDrop.amountUsd == null && priceAddress ? [priceAddress] : [],
    chain as ChainId,
  )
  const nativePrice = priceAddress ? prices[priceAddress] : undefined
  const amountUsd =
    gasDrop?.amountUsd ??
    (gasDrop && native && nativePrice && nativePrice > 0
      ? Number(formatUnits(BigInt(gasDrop.amount), native.decimals)) * nativePrice
      : undefined)

  return { amountUsd, symbol: native?.symbol }
}
