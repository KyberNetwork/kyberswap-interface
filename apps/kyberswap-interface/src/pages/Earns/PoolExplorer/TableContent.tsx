import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { PoolQueryParams, usePoolsExplorerQuery } from 'services/zapEarn'

import useTheme from 'hooks/useTheme'
import DesktopTableRow from 'pages/Earns/PoolExplorer/DesktopTableRow'
import MobileTableRow from 'pages/Earns/PoolExplorer/MobileTableRow'
import useFavoritePool from 'pages/Earns/PoolExplorer/useFavoritePool'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import Updater from 'state/customizeDexes/updater'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'

export const dexKeyMapping: { [key: string]: string } = {
  uniswapv2: 'uniswap',
  kodiakcl: 'kodiak-v3',
}

const POLLING_INTERVAL_MS = 5 * 60_000

const TableContent = ({
  onOpenZapInWidget,
  filters,
}: {
  onOpenZapInWidget: ({ pool }: ZapInInfo) => void
  filters: PoolQueryParams
}) => {
  const theme = useTheme()

  const allDexes = useAppSelector(state => state.customizeDexes.allDexes)
  const { data: poolData, refetch, isError } = usePoolsExplorerQuery(filters, { pollingInterval: POLLING_INTERVAL_MS })
  const { handleFavorite, favoriteLoading } = useFavoritePool({ refetch })

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const filterChainIds = useMemo(
    () => filters.chainIds?.split(',').filter(Boolean).map(Number) || [],
    [filters.chainIds],
  )

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
      const poolChainId = pool.chain?.id ?? pool.chainId
      const dexKey = dexKeyMapping[pool.exchange] || pool.exchange
      const dexInfo = poolChainId ? dexLookupMap.get(poolChainId)?.get(dexKey) : undefined

      return {
        ...pool,
        dexLogo: dexInfo?.logoURL || '',
        dexName: dexInfo?.name || pool.exchange,
        feeApr: pool.apr,
        apr: pool.apr + (pool.kemEGApr || 0) + (pool.kemLMApr || 0) + (pool.bonusApr || 0),
      }
    })
  }, [poolData?.data?.pools, dexLookupMap])

  if (!tablePoolData?.length || isError)
    return (
      <Text color={theme.subText} margin="3rem" marginTop="4rem" textAlign="center">
        {t`No data found`}
      </Text>
    )

  return (
    <>
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

      {filterChainIds.map(chainId => (
        <Updater key={chainId} customChainId={chainId} />
      ))}
    </>
  )
}

export default TableContent
