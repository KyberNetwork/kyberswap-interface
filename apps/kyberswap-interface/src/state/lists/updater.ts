import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useGetChainsConfigurationQuery } from 'services/ksSetting'

import { APP_PATHS } from 'constants/index'
import { LEGACY_POOL_APP_PATHS } from 'constants/legacyPools'
import { useActiveWeb3React } from 'hooks'
import { useEnsureTokenList } from 'hooks/useTokens'
import { getChainIdFromSlug } from 'utils/string'

const getPathChainId = (pathname: string): ChainId | undefined => {
  const [firstSegment, secondSegment] = pathname.split('/').filter(Boolean).map(decodeURIComponent)

  if (firstSegment === APP_PATHS.POOLS.slice(1)) {
    return getChainIdFromSlug(secondSegment)
  }

  const chainIdFromFirstSegment = getChainIdFromSlug(firstSegment)
  if (chainIdFromFirstSegment) return chainIdFromFirstSegment

  if ([APP_PATHS.SWAP, APP_PATHS.LIMIT, LEGACY_POOL_APP_PATHS.MY_POOLS].some(path => firstSegment === path.slice(1))) {
    return getChainIdFromSlug(secondSegment)
  }

  return undefined
}

export default function Updater(): null {
  const { chainId } = useActiveWeb3React()
  const { pathname } = useLocation()
  const pathChainId = useMemo(() => getPathChainId(pathname), [pathname])

  useGetChainsConfigurationQuery()
  useEnsureTokenList(chainId)
  useEnsureTokenList(pathChainId)

  return null
}
