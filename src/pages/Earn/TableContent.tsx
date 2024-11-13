import { useMemo } from 'react'
import { Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetDexListQuery } from 'services/ksSetting'
import { usePoolsExplorerQuery } from 'services/zapEarn'

import { Image } from 'components/Image'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { Direction } from 'pages/MarketOverview/SortIcon'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { FilterTag, SortBy } from '.'
import {
  Apr,
  CurrencyRoundedImage,
  CurrencySecondImage,
  FeeTier,
  MobileTableBottomRow,
  MobileTableRow,
  TableBody,
  TableRow,
} from './styles'
import useFilter from './useFilter'

const TableContent = () => {
  const theme = useTheme()
  const { filters } = useFilter()
  const dexList = useGetDexListQuery({
    chainId: NETWORKS_INFO[filters.chainId].ksSettingRoute,
  })
  const { data: poolData } = usePoolsExplorerQuery(filters)

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const tablePoolData = useMemo(() => {
    const parsedPoolData = (poolData?.data?.pools || []).map(pool => ({
      ...pool,
      dexLogo: dexList.data?.find(dex => dex.dexId === pool.exchange)?.logoURL || '',
      dexName: dexList.data?.find(dex => dex.dexId === pool.exchange)?.name || '',
    }))

    if (filters.tag && Object.keys(FilterTag).includes(filters.tag) && filters.sortBy) {
      parsedPoolData.sort((a, b) => {
        if (filters.sortBy === SortBy.APR) return filters.orderBy === Direction.DESC ? b.apr - a.apr : a.apr - b.apr
        if (filters.sortBy === SortBy.EARN_FEE)
          return filters.orderBy === Direction.DESC ? b.earnFee - a.earnFee : a.earnFee - b.earnFee
        if (filters.sortBy === SortBy.TVL)
          return filters.orderBy === Direction.DESC ? b.liquidity - a.liquidity : a.liquidity - b.liquidity
        if (filters.sortBy === SortBy.VOLUME)
          return filters.orderBy === Direction.DESC ? b.volume - a.volume : a.volume - b.volume
        return 0
      })
    }

    return parsedPoolData
  }, [poolData, filters, dexList])

  const handleFavorite = (e: React.MouseEvent<SVGElement, MouseEvent>) => {
    e.stopPropagation()
    // toggleFavorite(item)
  }

  if (upToMedium)
    return (
      <TableBody>
        {tablePoolData.map((pool, index) => (
          <MobileTableRow key={pool.address}>
            <Flex alignItems="flex-start" justifyContent="space-between">
              <Flex sx={{ gap: 1 }}>
                <Flex sx={{ position: 'relative', top: -1 }}>
                  <CurrencyRoundedImage src={pool.tokens?.[0]?.logoURI} width="24px" height="24px" alt="" />
                  <CurrencySecondImage src={pool.tokens?.[1]?.logoURI} width="24px" height="24px" alt="" />
                </Flex>
                <Flex flexDirection={'column'} sx={{ gap: 2 }}>
                  <Text>{/* {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol} */}USDT/ARB</Text>
                  <Flex sx={{ gap: 2 }}>
                    <Image src={pool.dexLogo} width="20px" height="20px" alt="" />
                    <FeeTier>{pool.feeTier * 100}%</FeeTier>
                  </Flex>
                </Flex>
              </Flex>
              <Flex alignItems="center" sx={{ gap: 4 }}>
                <Apr positive={pool.apr > 0}>{pool.apr}%</Apr>
                <Star
                  size={16}
                  color={theme.subText}
                  // color={item.isFavorite ? theme.yellow1 : theme.subText}
                  role="button"
                  cursor="pointer"
                  fill={'none'}
                  // fill={item.isFavorite ? theme.yellow1 : 'none'}
                  onClick={handleFavorite}
                />
              </Flex>
            </Flex>
            <MobileTableBottomRow withoutBorder={index === tablePoolData.length - 1}>
              <Flex flexDirection="column" sx={{ gap: 1 }}>
                <Text color={theme.subText}>Earn Fees</Text>
                <Text>{formatDisplayNumber(pool.earnFee, { style: 'currency', significantDigits: 6 })}</Text>
              </Flex>
              <Flex flexDirection="column" sx={{ gap: 1 }}>
                <Text color={theme.subText}>TVL</Text>
                <Text>{formatDisplayNumber(pool.liquidity, { style: 'currency', significantDigits: 6 })}</Text>
              </Flex>
              <Flex flexDirection="column" sx={{ gap: 1 }}>
                <Text color={theme.subText}>Volume</Text>
                <Text>{formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}</Text>
              </Flex>
            </MobileTableBottomRow>
          </MobileTableRow>
        ))}
      </TableBody>
    )

  return (
    <TableBody>
      {tablePoolData.map(pool => (
        <TableRow key={pool.address}>
          <Flex fontSize={14} alignItems="center" sx={{ gap: 1 }}>
            <Image src={pool.dexLogo} width="20px" height="20px" alt="" />
            <Text color={theme.subText}>{pool.dexName}</Text>
          </Flex>
          <Flex alignItems="center" sx={{ gap: 2 }}>
            <Flex alignItems="center">
              <CurrencyRoundedImage src={pool.tokens?.[0]?.logoURI} width="24px" height="24px" alt="" />
              <CurrencySecondImage src={pool.tokens?.[1]?.logoURI} width="24px" height="24px" alt="" />
            </Flex>
            <Text>
              {/* {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol} */}
              USDT/ARB
            </Text>
            <FeeTier>{pool.feeTier * 100}%</FeeTier>
          </Flex>
          <Apr positive={pool.apr > 0}>{pool.apr}%</Apr>
          <Flex justifyContent="flex-end">
            {formatDisplayNumber(pool.earnFee, { style: 'currency', significantDigits: 6 })}
          </Flex>
          <Flex justifyContent="flex-end">
            {formatDisplayNumber(pool.liquidity, { style: 'currency', significantDigits: 6 })}
          </Flex>
          <Flex justifyContent="flex-end">
            {formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}
          </Flex>
          <Flex justifyContent="center">
            <Star
              size={16}
              color={theme.subText}
              // color={item.isFavorite ? theme.yellow1 : theme.subText}
              role="button"
              cursor="pointer"
              fill={'none'}
              // fill={item.isFavorite ? theme.yellow1 : 'none'}
              onClick={handleFavorite}
            />
          </Flex>
        </TableRow>
      ))}
    </TableBody>
  )
}

export default TableContent
