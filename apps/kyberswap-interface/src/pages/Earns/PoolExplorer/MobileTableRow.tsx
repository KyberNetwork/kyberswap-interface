import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { Star } from 'react-feather'
import { Flex, Text } from 'rebass'
import { PoolQueryParams } from 'services/zapEarn'

import CopyHelper from 'components/Copy'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { kemFarming } from 'pages/Earns/PoolExplorer/DesktopTableRow'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import {
  Apr,
  FeeTier,
  MobileTableBottomRow,
  MobileTableRow as MobileTableRowComponent,
  SymbolText,
} from 'pages/Earns/PoolExplorer/styles'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import { ParsedEarnPool } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

const MobileTableRow = ({
  pool,
  filters,
  onOpenZapInWidget,
  handleFavorite,
  withoutBorder,
}: {
  pool: ParsedEarnPool
  filters: PoolQueryParams
  onOpenZapInWidget: ({ pool, initialTick }: ZapInInfo) => void
  handleFavorite: (e: React.MouseEvent<SVGElement, MouseEvent>, pool: ParsedEarnPool) => Promise<void>
  withoutBorder: boolean
}) => {
  const theme = useTheme()
  const isFarmingFiltered = filters.tag === FilterTag.FARMING_POOL

  const handleOpenZapInWidget = (e: React.MouseEvent<HTMLDivElement>, withPriceRange?: boolean) => {
    e.stopPropagation()
    onOpenZapInWidget({
      pool: {
        dex: pool.exchange,
        chainId: pool.chainId || filters.chainId,
        address: pool.address,
      },
      initialTick:
        withPriceRange &&
        pool.maxAprInfo &&
        pool.maxAprInfo.tickLower !== undefined &&
        pool.maxAprInfo.tickUpper !== undefined
          ? {
              tickLower: pool.maxAprInfo.tickLower,
              tickUpper: pool.maxAprInfo.tickUpper,
            }
          : undefined,
    })
  }

  return (
    <MobileTableRowComponent onClick={e => handleOpenZapInWidget(e)}>
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
      <MobileTableBottomRow withoutBorder={withoutBorder}>
        {isFarmingFiltered && (
          <Flex justifyContent="space-between" sx={{ gap: 1 }} onClick={e => handleOpenZapInWidget(e, true)}>
            <Text color={theme.subText}>Max APR</Text>
            <Text>
              {pool.maxAprInfo
                ? formatAprNumber(
                    Number(pool.maxAprInfo.apr || 0) +
                      Number(pool.maxAprInfo.kemEGApr || 0) +
                      Number(pool.maxAprInfo.kemLMApr || 0),
                  ) + '%'
                : '--'}
            </Text>
          </Flex>
        )}
        <Flex justifyContent="space-between" sx={{ gap: 1 }}>
          <Text color={theme.subText}>{t`Earn Fees`}</Text>
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
    </MobileTableRowComponent>
  )
}

export default MobileTableRow
