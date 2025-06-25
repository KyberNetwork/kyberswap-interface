import { useEffect, useMemo, useState } from 'react'
import { Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useAddFavoriteMutation, usePoolsExplorerQuery, useRemoveFavoriteMutation } from 'services/zapEarn'

import { NotificationType } from 'components/Announcement/type'
import CopyHelper from 'components/Copy'
import { Image } from 'components/Image'
import Loader from 'components/Loader'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
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
} from 'pages/Earns/PoolExplorer/styles'
import useFilter from 'pages/Earns/PoolExplorer/useFilter'
import { EarnPool } from 'pages/Earns/types'
import { formatAprNumber } from 'pages/Earns/utils'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export const dexMapping: { [key: string]: string } = {
  uniswapv2: 'uniswap',
  kodiakcl: 'kodiak-v3',
  uniswapv4: 'uniswap-v4',
}

const TableContent = ({ onOpenZapInWidget }: { onOpenZapInWidget: (pool: EarnPool) => void }) => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { filters } = useFilter()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()

  const allDexes = useAppSelector(state => state.customizeDexes.allDexes)
  const dexList = useMemo(() => {
    return allDexes[filters.chainId] || []
  }, [allDexes, filters.chainId])
  const { data: poolData, refetch, isError } = usePoolsExplorerQuery(filters, { pollingInterval: 5 * 60_000 })
  const [addFavorite] = useAddFavoriteMutation()
  const [removeFavorite] = useRemoveFavoriteMutation()

  const [favoriteLoading, setFavoriteLoading] = useState<string[]>([])
  const [delayFavorite, setDelayFavorite] = useState(false)

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const tablePoolData = useMemo(() => {
    return (poolData?.data?.pools || []).map(pool => ({
      ...pool,
      dexLogo: dexList.find(dex => dex.id === (dexMapping[pool.exchange] || pool.exchange))?.logoURL || '',
      dexName: dexList.find(dex => dex.id === (dexMapping[pool.exchange] || pool.exchange))?.name || '',
    }))
  }, [poolData, dexList])

  const handleFavorite = async (e: React.MouseEvent<SVGElement, MouseEvent>, pool: EarnPool) => {
    e.stopPropagation()
    if (favoriteLoading.includes(pool.address) || delayFavorite) return
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
    setDelayFavorite(true)
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

  useEffect(() => {
    if (delayFavorite)
      setTimeout(() => {
        setDelayFavorite(false)
      }, 500)
  }, [delayFavorite])

  if (!tablePoolData?.length || isError)
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
                  <CurrencyRoundedImage src={pool.tokens?.[0]?.logoURI} alt="" />
                  <CurrencySecondImage src={pool.tokens?.[1]?.logoURI} alt="" />
                </Flex>
                <Flex flexDirection={'column'} sx={{ gap: 2 }}>
                  <Flex sx={{ gap: 1 }}>
                    <SymbolText>
                      {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
                    </SymbolText>
                    <CopyHelper size={16} toCopy={pool.address?.toLowerCase()} />
                  </Flex>
                  <Flex sx={{ gap: 2 }}>
                    <Image src={pool.dexLogo} width="22px" height="22px" alt="" />
                    <FeeTier>{pool.feeTier}%</FeeTier>
                  </Flex>
                </Flex>
              </Flex>
              <Flex alignItems="center" sx={{ gap: 3 }}>
                <Apr positive={pool.apr > 0}>{formatAprNumber(pool.apr)}%</Apr>
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
                <Text>{formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}</Text>
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
              <CurrencyRoundedImage src={pool.tokens?.[0]?.logoURI} alt="" />
              <CurrencySecondImage src={pool.tokens?.[1]?.logoURI} alt="" />
            </Flex>
            <SymbolText>
              {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
            </SymbolText>
            <FeeTier>{pool.feeTier}%</FeeTier>
          </Flex>
          <Apr positive={pool.apr > 0}>{formatAprNumber(pool.apr)}%</Apr>
          <Flex justifyContent="flex-end">
            {formatDisplayNumber(pool.earnFee, { style: 'currency', significantDigits: 6 })}
          </Flex>
          <Flex justifyContent="flex-end">
            {formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}
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
