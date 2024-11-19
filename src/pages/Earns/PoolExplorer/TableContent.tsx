import { useMemo, useState } from 'react'
import { Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetDexListQuery } from 'services/ksSetting'
import { EarnPool, useAddFavoriteMutation, usePoolsExplorerQuery, useRemoveFavoriteMutation } from 'services/zapEarn'

import { NotificationType } from 'components/Announcement/type'
import { Image } from 'components/Image'
import Loader from 'components/Loader'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { Direction } from 'pages/MarketOverview/SortIcon'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
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
  SymbolText,
  TableBody,
  TableRow,
} from './styles'
import useFilter from './useFilter'

const TableContent = ({ onOpenZapInWidget }: { onOpenZapInWidget: (pool: EarnPool) => void }) => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { filters } = useFilter()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()

  const dexList = useGetDexListQuery({
    chainId: NETWORKS_INFO[filters.chainId].ksSettingRoute,
  })
  const { data: poolData, refetch } = usePoolsExplorerQuery(filters, { pollingInterval: 5 * 60_000 })
  const [addFavorite] = useAddFavoriteMutation()
  const [removeFavorite] = useRemoveFavoriteMutation()

  const [favoriteLoading, setFavoriteLoading] = useState<string[]>([])

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const tablePoolData = useMemo(() => {
    let parsedPoolData = (poolData?.data?.pools || []).map(pool => ({
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

      const page = filters.page || 0
      const limit = filters.limit || 0

      parsedPoolData = page > 9 ? [] : parsedPoolData.slice(page * limit, limit)
    }

    return parsedPoolData
  }, [poolData, filters, dexList])

  const handleFavorite = async (e: React.MouseEvent<SVGElement, MouseEvent>, pool: EarnPool) => {
    e.stopPropagation()
    if (favoriteLoading.includes(pool.address)) return
    handleAddFavoriteLoading(pool.address)

    if (!account) {
      toggleWalletModal()
      handleRemoveFavoriteLoading(pool.address)
      return
    }

    let signature = ''
    let msg = ''

    const key = `poolExplorer_${account}`
    try {
      const data = JSON.parse(localStorage.getItem(key) || '')
      if (data.issuedAt) {
        const expire = new Date(data.issuedAt)
        expire.setDate(expire.getDate() + 7)
        const now = new Date()
        if (expire > now) {
          signature = data.signature
          msg = data.msg
        }
      }
    } catch {
      handleRemoveFavoriteLoading(pool.address)
    }
    if (!signature) {
      const issuedAt = new Date().toISOString()
      msg = `Click sign to add favorite pools at Kyberswap.com without logging in.\nThis request won’t trigger any blockchain transaction or cost any gas fee. Expires in 7 days. \n\nIssued at: ${issuedAt}`
      signature = await library?.send('personal_sign', [`0x${Buffer.from(msg, 'utf8').toString('hex')}`, account])
      localStorage.setItem(
        key,
        JSON.stringify({
          signature,
          msg,
          issuedAt,
        }),
      )
    }

    const isPoolFavorite = !!pool.favorite?.isFavorite
    await (isPoolFavorite ? removeFavorite : addFavorite)({
      chainId: filters.chainId,
      userAddress: account,
      poolAddress: pool.address,
      message: msg,
      signature,
    })
      .then(res => {
        if ((res as any).error) {
          notify(
            {
              title: `${!isPoolFavorite ? 'Add' : 'Remove'} failed`,
              summary: (res as any).error.data.message || 'Some thing went wrong',
              type: NotificationType.ERROR,
            },
            8000,
          )
        } else refetch()
      })
      .catch(err => {
        // localStorage.removeItem(key)
        console.log(err)
        notify(
          {
            title: `${!isPoolFavorite ? 'Add' : 'Remove'} failed`,
            summary: err.message || 'Some thing went wrong',
            type: NotificationType.ERROR,
          },
          8000,
        )
      })
      .finally(() => handleRemoveFavoriteLoading(pool.address))
  }
  const handleAddFavoriteLoading = (poolAddress: string) => {
    if (!favoriteLoading.includes(poolAddress)) setFavoriteLoading([...favoriteLoading, poolAddress])
  }
  const handleRemoveFavoriteLoading = (poolAddress: string) =>
    setFavoriteLoading(favoriteLoading.filter(address => address !== poolAddress))

  if (!tablePoolData?.length)
    return (
      <Text color={theme.subText} margin="3rem" marginTop="4rem" textAlign="center">
        No data found
      </Text>
    )

  if (upToMedium)
    return (
      <TableBody>
        {tablePoolData.map((pool, index) => (
          <MobileTableRow key={pool.address} onClick={() => onOpenZapInWidget(pool)}>
            <Flex alignItems="flex-start" justifyContent="space-between">
              <Flex sx={{ gap: 1 }}>
                <Flex sx={{ position: 'relative', top: -1 }}>
                  <CurrencyRoundedImage src={pool.tokens?.[0]?.logoURI} width="24px" height="24px" alt="" />
                  <CurrencySecondImage src={pool.tokens?.[1]?.logoURI} width="24px" height="24px" alt="" />
                </Flex>
                <Flex flexDirection={'column'} sx={{ gap: 2 }}>
                  <SymbolText>
                    {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
                  </SymbolText>
                  <Flex sx={{ gap: 2 }}>
                    <Image src={pool.dexLogo} width="22px" height="22px" alt="" />
                    <FeeTier>{pool.feeTier}%</FeeTier>
                  </Flex>
                </Flex>
              </Flex>
              <Flex alignItems="center" sx={{ gap: 3 }}>
                <Apr positive={pool.apr > 0}>{pool.apr}%</Apr>
                <Star
                  size={16}
                  color={pool.favorite?.isFavorite ? theme.primary : theme.subText}
                  fill={pool.favorite?.isFavorite ? theme.primary : 'none'}
                  role="button"
                  cursor="pointer"
                  onClick={e => handleFavorite(e, pool)}
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
              <Flex flexDirection="column" alignItems={'flex-end'} sx={{ gap: 1 }}>
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
        <TableRow key={pool.address} onClick={() => onOpenZapInWidget(pool)}>
          <Flex fontSize={14} alignItems="center" sx={{ gap: 1 }}>
            <Image src={pool.dexLogo} width="20px" height="20px" alt="" />
            <Text color={theme.subText}>{pool.dexName}</Text>
          </Flex>
          <Flex alignItems="center" sx={{ gap: 2 }}>
            <Flex alignItems="center">
              <CurrencyRoundedImage src={pool.tokens?.[0]?.logoURI} width="24px" height="24px" alt="" />
              <CurrencySecondImage src={pool.tokens?.[1]?.logoURI} width="24px" height="24px" alt="" />
            </Flex>
            <SymbolText>
              {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
            </SymbolText>
            <FeeTier>{pool.feeTier}%</FeeTier>
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
            {favoriteLoading.includes(pool.address) ? (
              <Loader />
            ) : (
              <Star
                size={16}
                color={pool.favorite?.isFavorite ? theme.primary : theme.subText}
                fill={pool.favorite?.isFavorite ? theme.primary : 'none'}
                role="button"
                cursor="pointer"
                onClick={e => handleFavorite(e, pool)}
              />
            )}
          </Flex>
        </TableRow>
      ))}
    </TableBody>
  )
}

export default TableContent
