import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { useTokensMetrics } from 'components/TokenSelectorModal/hooks/useTokensMetrics'
import { TokenRowExtraMap, tokenRowKey } from 'components/TokenSelectorModal/types'
import { useTokenPrices } from 'state/tokenPrices/hooks'

export const useLocalTokenMetrics = (tokens: Currency[], chainId: ChainId): TokenRowExtraMap => {
  const metrics = useTokensMetrics(tokens, chainId)
  const addresses = useMemo(() => tokens.map(token => token.wrapped.address), [tokens])
  const prices = useTokenPrices(addresses, chainId)

  return useMemo(
    () =>
      Object.fromEntries(
        tokens.map(token => {
          const key = tokenRowKey(token.chainId, token.wrapped.address)
          return [key, { ...metrics[key], price: prices[token.wrapped.address.toLowerCase()] || metrics[key]?.price }]
        }),
      ),
    [tokens, metrics, prices],
  )
}
