import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { Star } from 'react-feather'
import { Flex, Text } from 'rebass'
import { PoolQueryParams } from 'services/zapEarn'

import CopyHelper from 'components/Copy'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { kemFarming } from 'pages/Earns/PoolExplorer/DesktopTableRow'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import SparklineChart from 'pages/Earns/PoolExplorer/SparklineChart'
import {
  Apr,
  FeeTier,
  MobileTableBottomRow,
  MobileTableCell,
  MobileTableRow as MobileTableRowComponent,
  SymbolText,
} from 'pages/Earns/PoolExplorer/styles'
import MerklAprInfo from 'pages/Earns/components/MerklAprInfo'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import { ParsedEarnPool } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

const MobileTableRow = ({
  pool,
  filters,
  onOpenZapInWidget,
  handleFavorite,
}: {
  pool: ParsedEarnPool
  filters: PoolQueryParams
  onOpenZapInWidget: ({ pool, initialTick }: ZapInInfo) => void
  handleFavorite: (e: React.MouseEvent<SVGElement, MouseEvent>, pool: ParsedEarnPool) => Promise<void>
}) => {
  const theme = useTheme()
  const { trackingHandler } = useTracking()
  const isFarmingFiltered = filters.tag === FilterTag.FARMING_POOL
  const rewardsTotalUsd = pool.merklOpportunity?.rewardsRecord?.total || 0

  const handleOpenZapInWidget = (e: React.MouseEvent<HTMLDivElement>, withPriceRange?: boolean) => {
    e.stopPropagation()
    trackingHandler(TRACKING_EVENT_TYPE.LIQ_POOL_SELECTED, {
      pool_pair: `${pool.tokens?.[0]?.symbol}/${pool.tokens?.[1]?.symbol}`,
      pool_protocol: pool.dexName,
      pool_fee_tier: `${pool.feeTier}%`,
      pool_tvl_usd: pool.tvl,
      pool_volume_24h_usd: pool.volume,
      pool_apr: pool.allApr,
      chain: pool.chain?.name,
    })
    onOpenZapInWidget({
      pool: {
        dex: pool.exchange,
        chainId: (pool.chain?.id || pool.chainId) as number,
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
      <MobileTableCell alignItems="flex-start" justifyContent="space-between">
        <Flex sx={{ gap: 1 }}>
          <Flex sx={{ position: 'relative', top: -1 }}>
            <TokenLogo src={pool.tokens?.[0]?.logoURI} />
            <TokenLogo src={pool.tokens?.[1]?.logoURI} translateLeft />
            {pool.chain?.logoUrl && <TokenLogo src={pool.chain.logoUrl} size={12} translateLeft translateTop />}
          </Flex>
          <Flex flexDirection="column" sx={{ gap: '8px' }}>
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
        <Flex alignItems="flex-start" sx={{ gap: '12px' }}>
          <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '4px' }}>
            <Flex alignItems="center" sx={{ gap: '2px' }}>
              <Apr value={pool.allApr}>{formatAprNumber(pool.allApr)}%</Apr>
              {kemFarming(pool)}
            </Flex>
            <MerklAprInfo pool={pool} />
          </Flex>
          <Flex alignItems="center" height={24}>
            <Star
              size={16}
              color={pool.favorite?.isFavorite ? theme.primary : theme.subText}
              fill={pool.favorite?.isFavorite ? theme.primary : 'none'}
              role="button"
              cursor="pointer"
              onClick={e => handleFavorite(e, pool)}
              aria-label={pool.favorite?.isFavorite ? t`Remove from favorites` : t`Add to favorites`}
            />
          </Flex>
        </Flex>
      </MobileTableCell>
      <MobileTableBottomRow>
        {isFarmingFiltered && (
          <MobileTableCell justifyContent="space-between" sx={{ gap: 1 }} onClick={e => handleOpenZapInWidget(e, true)}>
            <Text color={theme.subText}>{t`Max APR`}</Text>
            <Text>
              {pool.maxAprInfo
                ? formatAprNumber(
                    Number(pool.maxAprInfo.apr) +
                      Number(pool.maxAprInfo.kemEGApr) +
                      Number(pool.maxAprInfo.kemLMApr) +
                      Number(pool.bonusApr || 0),
                  ) + '%'
                : '--'}
            </Text>
          </MobileTableCell>
        )}
        <MobileTableCell justifyContent="space-between" sx={{ gap: 1 }}>
          <Text color={theme.subText}>{isFarmingFiltered ? t`EG Sharing` : t`Fee`}</Text>
          <Text>
            {formatDisplayNumber(isFarmingFiltered ? pool.egUsd : pool.earnFee, {
              style: 'currency',
              significantDigits: 6,
            })}
          </Text>
        </MobileTableCell>
        <MobileTableCell justifyContent="space-between" sx={{ gap: 1 }}>
          <Text color={theme.subText}>{t`Rewards`}</Text>
          <Text>
            {formatDisplayNumber((pool.egUsd || 0) + rewardsTotalUsd, { style: 'currency', significantDigits: 4 })}
          </Text>
        </MobileTableCell>
        <MobileTableCell justifyContent="space-between" sx={{ gap: 1 }}>
          <Text color={theme.subText}>{t`TVL`}</Text>
          <Text>{formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}</Text>
        </MobileTableCell>
        <MobileTableCell justifyContent="space-between" sx={{ gap: 1 }}>
          <Text color={theme.subText}>{t`Volume`}</Text>
          <Text>{formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}</Text>
        </MobileTableCell>
        <MobileTableCell>
          <SparklineChart
            sparkline={pool.sparkline}
            shouldInvert={pool.sparklinePriceToken !== pool.tokens[1].address}
            height={48}
          />
        </MobileTableCell>
      </MobileTableBottomRow>
    </MobileTableRowComponent>
  )
}

export default MobileTableRow
