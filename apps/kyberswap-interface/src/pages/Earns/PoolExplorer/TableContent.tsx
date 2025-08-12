import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { usePoolsExplorerQuery } from 'services/zapEarn'

import { ReactComponent as IconFarmingPool } from 'assets/svg/kyber/kem.svg'
import CopyHelper from 'components/Copy'
import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import {
  Apr,
  FeeTier,
  MobileTableBottomRow,
  MobileTableRow,
  SymbolText,
  TableBody,
  TableRow,
} from 'pages/Earns/PoolExplorer/styles'
import useFavoritePool from 'pages/Earns/PoolExplorer/useFavoritePool'
import useFilter from 'pages/Earns/PoolExplorer/useFilter'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import { ParsedEarnPool, ProgramType } from 'pages/Earns/types'
import Updater from 'state/customizeDexes/updater'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export const dexKeyMapping: { [key: string]: string } = {
  uniswapv2: 'uniswap',
  kodiakcl: 'kodiak-v3',
}

const POLLING_INTERVAL_MS = 5 * 60_000

const kemFarming = (pool: ParsedEarnPool) => {
  const programs = pool.programs || []
  const isFarming = programs.includes(ProgramType.EG) || programs.includes(ProgramType.LM)

  return isFarming ? (
    <MouseoverTooltipDesktopOnly
      placement="bottom"
      width="max-content"
      text={
        <div>
          {t`LP Fee APR`}: {formatAprNumber(pool.feeApr)}%
          <br />
          {t`EG Sharing Reward`}: {formatAprNumber(pool.kemEGApr || 0)}%
          <br />
          {t`LM Reward`}: {formatAprNumber(pool.kemLMApr || 0)}%
        </div>
      }
    >
      <IconFarmingPool width={24} height={24} style={{ marginLeft: 4 }} />
    </MouseoverTooltipDesktopOnly>
  ) : null
}

const TableContent = ({ onOpenZapInWidget }: { onOpenZapInWidget: ({ pool }: ZapInInfo) => void }) => {
  const theme = useTheme()
  const { filters } = useFilter()

  const allDexes = useAppSelector(state => state.customizeDexes.allDexes)
  const dexList = useMemo(() => {
    return allDexes[filters.chainId] || []
  }, [allDexes, filters.chainId])
  const { data: poolData, refetch, isError } = usePoolsExplorerQuery(filters, { pollingInterval: POLLING_INTERVAL_MS })
  const { handleFavorite, favoriteLoading } = useFavoritePool({ filters, refetch })

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const tablePoolData = useMemo(() => {
    return (poolData?.data?.pools || []).map(pool => ({
      ...pool,
      dexLogo: dexList.find(dex => dex.id === (dexKeyMapping[pool.exchange] || pool.exchange))?.logoURL || '',
      dexName: dexList.find(dex => dex.id === (dexKeyMapping[pool.exchange] || pool.exchange))?.name || '',
      feeApr: pool.apr,
      apr: (pool.kemEGApr || 0) + (pool.kemLMApr || 0) + pool.apr,
    }))
  }, [poolData, dexList])

  if (!tablePoolData?.length || isError)
    return (
      <Text color={theme.subText} margin="3rem" marginTop="4rem" textAlign="center">
        No data found
      </Text>
    )

  if (upToMedium)
    return (
      <>
        <TableBody>
          {tablePoolData.map((pool, index) => (
            <MobileTableRow
              key={pool.address}
              onClick={() =>
                onOpenZapInWidget({
                  pool: {
                    dex: pool.exchange,
                    chainId: pool.chainId || filters.chainId,
                    address: pool.address,
                  },
                })
              }
            >
              <Flex alignItems="flex-start" justifyContent="space-between">
                <Flex sx={{ gap: 1 }}>
                  <Flex sx={{ position: 'relative', top: -1 }}>
                    <TokenLogo src={pool.tokens?.[0]?.logoURI} />
                    <TokenLogo src={pool.tokens?.[1]?.logoURI} translateLeft />
                  </Flex>
                  <Flex flexDirection={'column'} sx={{ gap: 2 }}>
                    <Flex sx={{ gap: 1 }}>
                      <SymbolText>
                        {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
                      </SymbolText>
                      <CopyHelper size={16} toCopy={pool.address?.toLowerCase()} />
                    </Flex>
                    <Flex sx={{ gap: 2 }}>
                      <TokenLogo src={pool.dexLogo} size={22} />
                      <FeeTier>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</FeeTier>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex alignItems="center" sx={{ gap: '12px' }}>
                  <Flex alignItems="center" sx={{ gap: '2px' }}>
                    <Apr value={pool.apr}>{formatAprNumber(pool.apr)}%</Apr>
                    {kemFarming(pool)}
                  </Flex>
                  <Star
                    size={16}
                    color={pool.favorite?.isFavorite ? theme.primary : theme.subText}
                    fill={pool.favorite?.isFavorite ? theme.primary : 'none'}
                    role="button"
                    cursor="pointer"
                    onClick={e => handleFavorite(e, pool)}
                    aria-label={pool.favorite?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  />
                </Flex>
              </Flex>
              <MobileTableBottomRow withoutBorder={index === tablePoolData.length - 1}>
                <Flex justifyContent="space-between" sx={{ gap: 1 }}>
                  <Text color={theme.subText}>Earn Fees</Text>
                  <Text>{formatDisplayNumber(pool.earnFee, { style: 'currency', significantDigits: 6 })}</Text>
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
        <Updater customChainId={filters.chainId} />
      </>
    )

  return (
    <>
      <TableBody>
        {tablePoolData.map(pool => (
          <TableRow
            key={pool.address}
            onClick={() =>
              onOpenZapInWidget({
                pool: {
                  dex: pool.exchange,
                  chainId: pool.chainId || filters.chainId,
                  address: pool.address,
                },
              })
            }
          >
            <Flex fontSize={14} alignItems="center" sx={{ gap: 1 }}>
              <TokenLogo src={pool.dexLogo} size={20} />
              <Text color={theme.subText}>{pool.dexName}</Text>
            </Flex>
            <Flex alignItems="center" sx={{ gap: 2 }}>
              <Flex alignItems="center">
                <TokenLogo src={pool.tokens?.[0]?.logoURI} />
                <TokenLogo src={pool.tokens?.[1]?.logoURI} translateLeft />
              </Flex>
              <SymbolText>
                {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
              </SymbolText>
              <FeeTier>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</FeeTier>
            </Flex>
            <Apr value={pool.apr}>
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
      <Updater customChainId={filters.chainId} />
    </>
  )
}

export default TableContent
