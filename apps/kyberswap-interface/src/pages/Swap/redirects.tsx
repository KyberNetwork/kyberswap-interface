import { WETH } from '@kyberswap/ks-sdk-core'
import type { ReactNode } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'

import { APP_PATHS, ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { isSupportLimitOrder } from 'constants/networks'
import { NativeCurrencies, STABLE_TOKENS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { type SwapIntent, resolveSwapIntentPair } from 'utils/routes'
import { getChainIdFromSlug } from 'utils/string'

// Redirects to a network-specific trade page but only replaces the pathname
export const RedirectPathToTradeNetwork = () => {
  const { networkInfo, chainId } = useActiveWeb3React()
  const location = useLocation()
  const { pathname } = location

  let redirectTo = ''

  if (pathname.startsWith(APP_PATHS.LIMIT) && isSupportLimitOrder(chainId)) {
    redirectTo = APP_PATHS.LIMIT
  } else {
    redirectTo = APP_PATHS.SWAP
  }

  return (
    <Navigate
      to={{
        ...location,
        pathname: `${redirectTo}/${networkInfo.route}`,
      }}
      replace
    />
  )
}

export const SwapIntentRedirect = ({ intent, children }: { intent: SwapIntent; children: ReactNode }) => {
  const location = useLocation()
  const { network = '', token = '' } = useParams<{ network: string; token: string }>()
  const normalizedNetwork = network.toLowerCase()
  const chainId = getChainIdFromSlug(normalizedNetwork)
  const nativeSymbol = chainId === undefined ? undefined : NativeCurrencies[chainId].symbol?.toLowerCase()
  const stableCounterSymbol = chainId === undefined ? undefined : STABLE_TOKENS[chainId]?.symbol
  const wrappedNative = chainId === undefined ? undefined : WETH[chainId]

  if (!token || !nativeSymbol || !stableCounterSymbol) {
    return <>{children}</>
  }

  const { fromCurrency, toCurrency } = resolveSwapIntentPair({
    intent,
    subjectToken: token,
    nativeToken: nativeSymbol,
    stableCounterToken: stableCounterSymbol,
    nativeTokenAliases: [ETHER_ADDRESS, ZERO_ADDRESS],
    wrappedNativeAliases: [wrappedNative?.address, wrappedNative?.symbol].filter((alias): alias is string =>
      Boolean(alias),
    ),
  })
  const pathname = `${APP_PATHS.SWAP}/${normalizedNetwork}/${fromCurrency}-to-${toCurrency}`

  return <Navigate to={{ ...location, pathname }} replace />
}
