import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { PoolQueryParams, usePoolsExplorerQuery } from 'services/zapEarn'

import useTheme from 'hooks/useTheme'
import DesktopTableRow from 'pages/Earns/PoolExplorer/DesktopTableRow'
import MobileTableRow from 'pages/Earns/PoolExplorer/MobileTableRow'
import { TableBody } from 'pages/Earns/PoolExplorer/styles'
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
  const dexList = useMemo(() => {
    return allDexes[filters.chainId] || []
  }, [allDexes, filters.chainId])
  const { data: poolData, refetch, isError } = usePoolsExplorerQuery(filters, { pollingInterval: POLLING_INTERVAL_MS })
  const { handleFavorite, favoriteLoading } = useFavoritePool({ filters, refetch })

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  // Create a dex lookup map for better performance
  const dexLookupMap = useMemo(() => {
    const map = new Map<string, { logoURL: string; name: string }>()
    dexList.forEach(dex => {
      map.set(dex.id, { logoURL: dex.logoURL, name: dex.name })
    })
    return map
  }, [dexList])

  const tablePoolData = useMemo(() => {
    return (poolData?.data?.pools || []).map(pool => {
      const dexKey = dexKeyMapping[pool.exchange] || pool.exchange
      const dexInfo = dexLookupMap.get(dexKey) || { logoURL: '', name: '' }

      return {
        ...pool,
        dexLogo: dexInfo.logoURL,
        dexName: dexInfo.name,
        feeApr: pool.apr,
        apr: (pool.kemEGApr || 0) + (pool.kemLMApr || 0) + pool.apr,
      }
    })
  }, [poolData?.data?.pools, dexLookupMap])

  if (!tablePoolData?.length || isError)
    return (
      <Text color={theme.subText} margin="3rem" marginTop="4rem" textAlign="center">
        No data found
      </Text>
    )

  return (
    <>
      <TableBody>
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
      </TableBody>
      <Updater customChainId={filters.chainId} />
    </>
  )
}

export default TableContent
