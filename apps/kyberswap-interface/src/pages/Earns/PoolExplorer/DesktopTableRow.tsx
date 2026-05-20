import { t } from '@lingui/macro'
import { Star } from 'react-feather'
import { Text } from 'rebass'

import Loader from 'components/Loader'
import { HStack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import SparklineChart from 'pages/Earns/PoolExplorer/SparklineChart'
import { FeeTier, SymbolText, TableCell, TableRow } from 'pages/Earns/PoolExplorer/styles'
import MerklRewardsRecord from 'pages/Earns/components/MerklRewardsRecord'
import PoolAprBadges from 'pages/Earns/components/PoolAprBadges'
import PoolAprInfo from 'pages/Earns/components/PoolAprInfo'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import { ParsedEarnPool } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

const DesktopTableRow = ({
  pool,
  showRewards = true,
  showPoolPrice = true,
  onOpenZapInWidget,
  handleFavorite,
  favoriteLoading,
}: {
  pool: ParsedEarnPool
  showRewards?: boolean
  showPoolPrice?: boolean
  onOpenZapInWidget: ({ pool, initialTick }: ZapInInfo) => void
  handleFavorite: (e: React.MouseEvent<SVGElement, MouseEvent>, pool: ParsedEarnPool) => Promise<void>
  favoriteLoading: string[]
}) => {
  const theme = useTheme()
  const { trackingHandler } = useTracking()
  const rewardsTotalUsd = pool.merklOpportunity?.rewardsRecord?.total || 0

  const handleOpenZapInWidget = (e: React.MouseEvent<HTMLDivElement>) => {
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
    })
  }

  return (
    <TableRow showRewards={showRewards} showPoolPrice={showPoolPrice} onClick={e => handleOpenZapInWidget(e)}>
      <TableCell>
        <HStack align="center" gap={8}>
          <HStack align="flex-end" position="relative" gap={0}>
            <TokenLogo src={pool.tokens?.[0]?.logoURI} />
            <TokenLogo src={pool.tokens?.[1]?.logoURI} translateLeft />
            {pool.chain?.logoUrl && <TokenLogo src={pool.chain.logoUrl} size={12} translateLeft translateTop />}
          </HStack>
          <SymbolText>
            {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
          </SymbolText>
          <MouseoverTooltipDesktopOnly
            text={
              pool.merklOpportunity?.liveCampaigns
                ? `${t`Active Incentive Campaigns:`} ${pool.merklOpportunity.liveCampaigns}`
                : ''
            }
            width="fit-content"
            placement="bottom"
          >
            <FeeTier>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</FeeTier>
          </MouseoverTooltipDesktopOnly>
        </HStack>
        <HStack align="center" gap={4}>
          <TokenLogo src={pool.dexLogo} size={18} />
          <Text color={theme.subText} fontSize={14}>
            {pool.dexName}
          </Text>
        </HStack>
      </TableCell>
      <TableCell>
        <PoolAprInfo pool={pool} />
        <PoolAprBadges pool={pool} />
      </TableCell>
      <TableCell>
        <Text>
          {formatDisplayNumber(pool.earnFee, {
            style: 'currency',
            significantDigits: 6,
          })}
        </Text>
      </TableCell>
      <TableCell>
        <Text>{formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}</Text>
      </TableCell>
      <TableCell>
        <Text>{formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}</Text>
      </TableCell>
      {showRewards && (
        <TableCell>
          <Text>
            {formatDisplayNumber((pool.egUsd || 0) + rewardsTotalUsd, { style: 'currency', significantDigits: 4 })}
          </Text>
          <MerklRewardsRecord pool={pool} />
        </TableCell>
      )}
      {showPoolPrice && (
        <TableCell>
          <SparklineChart
            sparkline={pool.sparkline}
            shouldInvert={pool.sparklinePriceToken !== pool.tokens[1].address}
          />
        </TableCell>
      )}
      <TableCell justifyContent="flex-start" pt={16}>
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
      </TableCell>
    </TableRow>
  )
}

export default DesktopTableRow
