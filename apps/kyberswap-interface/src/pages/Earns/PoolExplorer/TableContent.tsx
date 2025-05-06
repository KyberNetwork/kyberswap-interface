import { useEffect, useMemo, useState } from 'react'
import { Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetDexListQuery } from 'services/ksSetting'
import { useAddFavoriteMutation, usePoolsExplorerQuery, useRemoveFavoriteMutation } from 'services/zapEarn'
import { EarnPool } from 'pages/Earns/types'

import { NotificationType } from 'components/Announcement/type'
import CopyHelper from 'components/Copy'
import TokenLogo from 'components/TokenLogo'
import Loader from 'components/Loader'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'
import { ReactComponent as IconFarmingPool } from 'assets/svg/kyber/kem.svg'

import { formatAprNumber } from 'pages/Earns/utils'
import {
  Apr,
  FeeTier,
  MobileTableBottomRow,
  MobileTableRow,
  SymbolText,
  TableBody,
  TableRow,
} from 'pages/Earns/PoolExplorer/styles'
import useFilter from 'pages/Earns/PoolExplorer/useFilter'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'

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

  const dexList = useGetDexListQuery({
    chainId: NETWORKS_INFO[filters.chainId].ksSettingRoute,
  })
  const { data: poolData, refetch, isError } = usePoolsExplorerQuery(filters, { pollingInterval: 5 * 60_000 })
  const [addFavorite] = useAddFavoriteMutation()
  const [removeFavorite] = useRemoveFavoriteMutation()

  const [favoriteLoading, setFavoriteLoading] = useState<string[]>([])
  const [delayFavorite, setDelayFavorite] = useState(false)

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const tablePoolData = useMemo(() => {
    return (poolData?.data?.pools || []).map(pool => ({
      ...pool,
      dexLogo: dexList.data?.find(dex => dex.dexId === (dexMapping[pool.exchange] || pool.exchange))?.logoURL || '',
      dexName: dexList.data?.find(dex => dex.dexId === (dexMapping[pool.exchange] || pool.exchange))?.name || '',
      // farming: null,
      farming: {
        lpFeeApr: 1.0,
        farmRewardApr: 0.24,
      },
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

  const kemFarming = (pool: { farming: { lpFeeApr: number; farmRewardApr: number } }) => (
    <MouseoverTooltipDesktopOnly
      placement="bottom"
      width="max-content"
      text={
        <div>
          LP Fee APR: {pool.farming.lpFeeApr}%
          <br />
          Farm Rewards APR: {pool.farming.farmRewardApr}%
        </div>
      }
    >
      <IconFarmingPool width={24} height={24} style={{ marginLeft: 4 }} />
    </MouseoverTooltipDesktopOnly>
  )

  const rewardToken = 'KNC'

  if (upToMedium)
    return (
      <TableBody>
        {tablePoolData.map((pool, index) => (
          <MobileTableRow key={pool.address} onClick={() => onOpenZapInWidget(pool)}>
            <Flex alignItems="flex-start" justifyContent="space-between">
              <Flex sx={{ gap: 1 }}>
                <Flex sx={{ position: 'relative', top: -1 }}>
                  <TokenLogo src={pool.tokens?.[0]?.logoURI} />
                  <TokenLogo src={pool.tokens?.[1]?.logoURI} />
                </Flex>
                <Flex flexDirection={'column'} sx={{ gap: 2 }}>
                  <Flex sx={{ gap: 1 }}>
                    <SymbolText>
                      {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
                    </SymbolText>
                    <CopyHelper size={16} toCopy={pool.address?.toLowerCase()} />
                  </Flex>
                  <Flex sx={{ gap: 2 }}>
                    <TokenLogo src={pool.dexLogo} width={22} height={22} />
                    <FeeTier>{pool.feeTier}%</FeeTier>
                  </Flex>
                </Flex>
              </Flex>
              <Flex alignItems="center" sx={{ gap: '12px' }}>
                <Flex alignItems="center" sx={{ gap: '2px' }}>
                  <Apr positive={pool.apr > 0}>{formatAprNumber(pool.apr)}%</Apr>
                  {kemFarming(pool)}
                </Flex>
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
              <Flex justifyContent="space-between" sx={{ gap: 1 }}>
                <Text color={theme.subText}>Earn Fees</Text>
                <Text>{formatDisplayNumber(pool.earnFee, { style: 'currency', significantDigits: 6 })}</Text>
              </Flex>
              <Flex justifyContent="space-between" sx={{ gap: 1 }}>
                <Text color={theme.subText}>Rewards</Text>
                <Text>
                  {formatDisplayNumber(pool.earnFee, { significantDigits: 6 })} {rewardToken}
                </Text>
              </Flex>
              <Flex justifyContent="space-between" sx={{ gap: 1 }}>
                <Text color={theme.subText}>TVL</Text>
                <Text>{formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}</Text>
              </Flex>
              <Flex justifyContent="space-between" sx={{ gap: 1 }}>
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
            <TokenLogo src={pool.dexLogo} width={20} height={20} />
            <Text color={theme.subText}>{pool.dexName}</Text>
          </Flex>
          <Flex alignItems="center" sx={{ gap: 2 }}>
            <Flex alignItems="center">
              <TokenLogo src={pool.tokens?.[0]?.logoURI} />
              <TokenLogo src={pool.tokens?.[1]?.logoURI} />
            </Flex>
            <SymbolText>
              {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
            </SymbolText>
            <FeeTier>{pool.feeTier}%</FeeTier>
          </Flex>
          <Apr positive={pool.apr > 0}>
            {formatAprNumber(pool.apr)}% {kemFarming(pool)}
          </Apr>
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
