import { t } from '@lingui/macro'
import { Star } from 'react-feather'

import { TableCell, TableRow, getPoolTableGridTemplateColumns } from 'components/Listing/Table'
import Loader from 'components/Loader'
import { HStack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import usePrefetchOnIntent from 'hooks/usePrefetchOnIntent'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import SparklineChart from 'pages/Earns/PoolExplorer/SparklineChart'
import { FeeTier, SymbolText } from 'pages/Earns/PoolExplorer/styles'
import PoolAprBadges from 'pages/Earns/components/PoolAprBadges'
import PoolAprInfo from 'pages/Earns/components/PoolAprInfo'
import PoolRewardsInfo from 'pages/Earns/components/PoolRewardsInfo'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import { ParsedEarnPool } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'
import { prefetchPoolDetail } from 'utils/prefetch'

const DesktopTableRow = ({
  pool,
  showRewards = true,
  showPoolPrice = true,
  rowIndex,
  onOpenZapInWidget,
  handleFavorite,
  favoriteLoading,
}: {
  pool: ParsedEarnPool
  showRewards?: boolean
  showPoolPrice?: boolean
  /** 0-based position within the current page — drives the staggered fade-in delay. */
  rowIndex: number
  onOpenZapInWidget: ({ pool, initialTick }: ZapInInfo) => void
  handleFavorite: (e: React.MouseEvent<SVGElement, MouseEvent>, pool: ParsedEarnPool) => Promise<void>
  favoriteLoading: string[]
}) => {
  const theme = useTheme()
  const { trackingHandler } = useTracking()

  // Stagger each row's fade-in by 50ms (capped at 300ms), matching the My Positions list.
  const animationDelay = `${Math.min(rowIndex * 50, 300)}ms`

  // The parent wires this row's onClick (onOpenZapInWidget) to open the pool's detail page, so warm
  // that page's chunk + its poolDetail query on hover.
  const prefetchDetail = usePrefetchOnIntent(
    () => prefetchPoolDetail((pool.chain?.id || pool.chainId) as number, pool.address),
    { delay: 120 },
  )

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
    <TableRow
      onClick={e => handleOpenZapInWidget(e)}
      className="animate-[fadeInUp_0.3s_ease-out_both] cursor-pointer hover:bg-primary-10 motion-reduce:animate-none"
      style={{ gridTemplateColumns: getPoolTableGridTemplateColumns(showRewards, showPoolPrice), animationDelay }}
      data-testid="earn-pool-row"
      data-pool-address={pool.address}
      data-chain-id={pool.chain?.id || pool.chainId}
      data-exchange={pool.exchange}
      {...prefetchDetail}
    >
      <TableCell>
        <HStack className="items-center gap-2">
          <HStack className="relative items-end gap-0">
            <TokenLogo src={pool.tokens?.[0]?.logoURI} />
            <TokenLogo src={pool.tokens?.[1]?.logoURI} translateLeft />
            {pool.chain?.logoUrl && <TokenLogo src={pool.chain.logoUrl} size={12} translateLeft translateTop />}
          </HStack>
          <SymbolText data-testid="earn-pool-row-pair">
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
            <FeeTier data-testid="earn-pool-row-fee-tier">
              {formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%
            </FeeTier>
          </MouseoverTooltipDesktopOnly>
        </HStack>
        <HStack className="items-center gap-1">
          <TokenLogo src={pool.dexLogo} size={18} />
          <span className="text-sm text-subText" data-testid="earn-pool-row-protocol">
            {pool.dexName}
          </span>
        </HStack>
      </TableCell>
      <TableCell className="gap-1" data-testid="earn-pool-row-apr">
        <PoolAprInfo pool={pool} data-testid="earn-pool-row-apr-value" />
        <PoolAprBadges pool={pool} />
      </TableCell>
      <TableCell>
        <span data-testid="earn-pool-row-fee">
          {formatDisplayNumber(pool.earnFee, {
            style: 'currency',
            significantDigits: 6,
          })}
        </span>
      </TableCell>
      <TableCell>
        <span data-testid="earn-pool-row-tvl">
          {formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}
        </span>
      </TableCell>
      <TableCell>
        <span data-testid="earn-pool-row-volume">
          {formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}
        </span>
      </TableCell>
      {showRewards && (
        <TableCell>
          <PoolRewardsInfo pool={pool} data-testid="earn-pool-row-rewards" />
        </TableCell>
      )}
      {showPoolPrice && (
        <TableCell data-testid="earn-pool-row-price">
          <SparklineChart
            sparkline={pool.sparkline}
            shouldInvert={pool.sparklinePriceToken !== pool.tokens[1].address}
          />
        </TableCell>
      )}
      <TableCell className="pt-4">
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
            data-testid="earn-pool-row-favorite"
            data-favorite={!!pool.favorite?.isFavorite}
          />
        )}
      </TableCell>
    </TableRow>
  )
}

export default DesktopTableRow
