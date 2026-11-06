import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo } from 'react'

import { ChainSnapshot } from 'components/TokenSelectorModal/AllNetworks/types'
import { useCatalogPriceFallback } from 'components/TokenSelectorModal/hooks/useCatalogPriceFallback'
import { TokenRowExtraMap, tokenRowKey } from 'components/TokenSelectorModal/types'

type Props = {
  chainId: ChainId
  session: string
  currencies: Currency[]
  extras: TokenRowExtraMap
  onSnapshot: (session: string, chainId: ChainId, snapshot: ChainSnapshot) => void
}

export const CatalogPrices = ({ chainId, session, currencies, extras, onSnapshot }: Props) => {
  const chainExtras = useMemo(
    () =>
      Object.fromEntries(
        currencies.map(token => {
          const key = tokenRowKey(token.chainId, token.wrapped.address)
          return [key, extras[key]]
        }),
      ),
    [currencies, extras],
  )
  const priced = useCatalogPriceFallback(currencies, chainExtras, chainId, true)

  useEffect(() => {
    onSnapshot(session, chainId, { currencies: [], balances: {}, extras: priced, loading: false })
  }, [session, chainId, priced, onSnapshot])
  return null
}
