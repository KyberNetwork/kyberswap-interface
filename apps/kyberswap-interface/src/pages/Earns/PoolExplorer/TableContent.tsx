import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { PoolQueryParams, usePoolsExplorerQuery } from 'services/zapEarn'

import LocalLoader from 'components/LocalLoader'
import ProgressBar from 'components/ProgressBar'
import useTheme from 'hooks/useTheme'
import DesktopTableRow from 'pages/Earns/PoolExplorer/DesktopTableRow'
import MobileTableRow from 'pages/Earns/PoolExplorer/MobileTableRow'
import { ProgressBarWrapper } from 'pages/Earns/PoolExplorer/styles'
import useFavoritePool from 'pages/Earns/PoolExplorer/useFavoritePool'
import { EARN_DEXES } from 'pages/Earns/constants'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import Updater from 'state/customizeDexes/updater'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'

export const dexKeyMapping: { [key: string]: string } = {
  uniswapv2: 'uniswap',
  kodiakcl: 'kodiak-v3',
}

const POLLING_INTERVAL_MS = 5 * 60_000

type Props = {
  onOpenZapInWidget: ({ pool }: ZapInInfo) => void
  filters: PoolQueryParams
}

const TableContent = ({ onOpenZapInWidget, filters }: Props) => {
  const theme = useTheme()

  const allDexes = useAppSelector(state => state.customizeDexes.allDexes)
  const {
    data: poolData,
    refetch,
    isLoading,
    isFetching,
    isError,
  } = usePoolsExplorerQuery(filters, { pollingInterval: POLLING_INTERVAL_MS })
  const { handleFavorite, favoriteLoading, getFavoriteStatus } = useFavoritePool({ refetch })

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const visibleChainIds = useMemo(() => {
    const filterChainIds = filters.chainIds?.split(',').filter(Boolean).map(Number) || []
    if (filterChainIds.length) return filterChainIds

    const poolChainIds = poolData?.data?.pools?.map(pool => pool.chain?.id ?? pool.chainId).filter(Boolean) || []
    return Array.from(new Set(poolChainIds))
  }, [filters.chainIds, poolData?.data?.pools])

  // Create a dex lookup map for better performance
  const dexLookupMap = useMemo(() => {
    const map = new Map<number, Map<string, { logoURL: string; name: string }>>()

    Object.entries(allDexes || {}).forEach(([chainId, dexes]) => {
      const dexMap = new Map<string, { logoURL: string; name: string }>()
      dexes.forEach(dex => {
        dexMap.set(dex.id, { logoURL: dex.logoURL, name: dex.name })
      })
      map.set(Number(chainId), dexMap)
    })
    return map
  }, [allDexes])

  const tablePoolData = useMemo(() => {
    return (poolData?.data?.pools || []).map(pool => {
      const poolChainId = (pool.chain?.id ?? pool.chainId) as number

      const dexKey = dexKeyMapping[pool.exchange] || pool.exchange

      const dexConfig = EARN_DEXES[pool.exchange]

      const dexInfo = dexConfig
        ? { logoURL: dexConfig.logo || '', name: dexConfig.name || '' }
        : poolChainId
        ? dexLookupMap.get(poolChainId)?.get(dexKey)
        : undefined

      return {
        ...pool,
        dexLogo: dexInfo?.logoURL || '',
        dexName: dexInfo?.name || pool.exchange,
        favorite: { chainId: poolChainId, isFavorite: getFavoriteStatus(pool) },
      }
    })
  }, [poolData?.data?.pools, dexLookupMap, getFavoriteStatus])

  if (isLoading) {
    return <LocalLoader />
  }

  if (poolData?.data?.pools.length === 0 || isError) {
    return (
      <Text color={theme.subText} margin="3rem" marginTop="4rem" textAlign="center">
        {t`No data found`}
      </Text>
    )
  }

  const loadingProgress = (
    <ProgressBarWrapper>
      <ProgressBar loading height="3px" width="100%" />
    </ProgressBarWrapper>
  )

  return (
    <>
      {isFetching && loadingProgress}
      <div>
        {tablePoolData.map((pool, index) =>
          upToMedium ? (
            <MobileTableRow
              key={pool.address}
              pool={pool}
              filters={filters}
              onOpenZapInWidget={onOpenZapInWidget}
              handleFavorite={handleFavorite}
              withoutBorder={index === tablePoolData.length - 1}
            />
          ) : (
            <DesktopTableRow
              key={pool.address}
              pool={pool}
              filters={filters}
              onOpenZapInWidget={onOpenZapInWidget}
              handleFavorite={handleFavorite}
              favoriteLoading={favoriteLoading}
            />
          ),
        )}
      </div>
      {isFetching && upToMedium && loadingProgress}

      {/* Important to load dex info */}
      {visibleChainIds.map(chainId => (
        <Updater key={chainId} customChainId={chainId} />
      ))}
    </>
  )
}

export default TableContent
