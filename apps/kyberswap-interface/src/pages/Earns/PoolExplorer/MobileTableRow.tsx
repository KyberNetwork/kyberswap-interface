import { t } from '@lingui/macro'
import { Star } from 'react-feather'

import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import usePrefetchOnIntent from 'hooks/usePrefetchOnIntent'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import SparklineChart from 'pages/Earns/PoolExplorer/SparklineChart'
import {
  FeeTier,
  HeaderText,
  MobileTableBottomRow,
  MobileTableCell,
  MobileTableRow as MobileTableRowComponent,
  SymbolText,
} from 'pages/Earns/PoolExplorer/styles'
import PoolAprBadges from 'pages/Earns/components/PoolAprBadges'
import PoolAprInfo from 'pages/Earns/components/PoolAprInfo'
import PoolRewardsInfo from 'pages/Earns/components/PoolRewardsInfo'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import { ParsedEarnPool } from 'pages/Earns/types'
import { getPoolDetailUrl } from 'pages/Earns/utils/url'
import { formatDisplayNumber } from 'utils/numbers'
import { prefetchPoolDetail } from 'utils/prefetch'

const MobileTableRow = ({
  pool,
  showRewards = true,
  rowIndex,
  onOpenZapInWidget,
  handleFavorite,
}: {
  pool: ParsedEarnPool
  showRewards?: boolean
  /** 0-based position within the current page — drives the staggered fade-in delay. */
  rowIndex: number
  onOpenZapInWidget: ({ pool, initialTick }: ZapInInfo) => void
  handleFavorite: (e: React.MouseEvent<SVGElement, MouseEvent>, pool: ParsedEarnPool) => Promise<void>
}) => {
  const theme = useTheme()
  const { trackingHandler } = useTracking()

  const poolChainId = (pool.chain?.id || pool.chainId) as number

  // Stagger each row's fade-in by 50ms (capped at 300ms), matching the My Positions list.
  const animationDelay = `${Math.min(rowIndex * 50, 300)}ms`

  // Same as the desktop row: the row's onClick opens the pool's detail page, so warm that page's chunk +
  // poolDetail query on touch-intent (onTouchStart is the only practically-relevant trigger on mobile).
  const prefetchDetail = usePrefetchOnIntent(() => prefetchPoolDetail(poolChainId, pool.address), { delay: 120 })

  const handleOpenZapInWidget = (e: React.MouseEvent<HTMLElement>) => {
    // Modified clicks (cmd/ctrl/shift/alt or a non-primary button) belong to the browser so the row's
    // href can open in a new tab or window; only a plain click routes in-app.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
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
        chainId: poolChainId,
        address: pool.address,
      },
    })
  }

  return (
    <MobileTableRowComponent
      as="a"
      href={getPoolDetailUrl(poolChainId, pool.exchange, pool.address)}
      onClick={e => handleOpenZapInWidget(e)}
      className="animate-[fadeInUp_0.3s_ease-out_both] motion-reduce:animate-none"
      style={{ animationDelay }}
      data-testid="earn-pool-row"
      data-pool-address={pool.address}
      data-chain-id={poolChainId}
      data-exchange={pool.exchange}
      {...prefetchDetail}
    >
      <MobileTableCell alignItems="flex-start" justifyContent="space-between">
        <Stack className="items-start gap-2">
          <HStack className="items-center gap-2">
            <HStack>
              <TokenLogo src={pool.tokens?.[0]?.logoURI} />
              <TokenLogo src={pool.tokens?.[1]?.logoURI} translateLeft />
              {pool.chain?.logoUrl && (
                <TokenLogo src={pool.chain.logoUrl} size={12} translateLeft translateTop className="size-3" />
              )}
            </HStack>
            <SymbolText data-testid="earn-pool-row-pair">
              {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
            </SymbolText>
            <FeeTier data-testid="earn-pool-row-fee-tier">
              {formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%
            </FeeTier>
          </HStack>
          <FeeTier data-testid="earn-pool-row-protocol">
            <TokenLogo src={pool.dexLogo} size={16} />
            {pool.dexName}
          </FeeTier>
        </Stack>
        <Star
          size={16}
          color={pool.favorite?.isFavorite ? theme.primary : theme.subText}
          fill={pool.favorite?.isFavorite ? theme.primary : 'none'}
          role="button"
          cursor="pointer"
          onClick={e => handleFavorite(e, pool)}
          aria-label={pool.favorite?.isFavorite ? t`Remove from favorites` : t`Add to favorites`}
          data-testid="earn-pool-row-favorite"
          data-favorite={!!pool.favorite?.isFavorite}
        />
      </MobileTableCell>
      <MobileTableBottomRow>
        <MobileTableCell alignItems="baseline" justifyContent="space-between" className="gap-1">
          <HeaderText className="text-subText">{t`APR`}</HeaderText>
          <HStack className="items-center gap-1" data-testid="earn-pool-row-apr">
            <PoolAprInfo pool={pool} data-testid="earn-pool-row-apr-value" />
            <PoolAprBadges pool={pool} />
          </HStack>
        </MobileTableCell>
        <MobileTableCell justifyContent="space-between" className="gap-1">
          <HeaderText className="text-subText">{t`Fee`}</HeaderText>
          <span data-testid="earn-pool-row-fee">
            {formatDisplayNumber(pool.earnFee, {
              style: 'currency',
              significantDigits: 6,
            })}
          </span>
        </MobileTableCell>
        <MobileTableCell justifyContent="space-between" className="gap-1">
          <HeaderText className="text-subText">{t`TVL`}</HeaderText>
          <span data-testid="earn-pool-row-tvl">
            {formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}
          </span>
        </MobileTableCell>
        <MobileTableCell justifyContent="space-between" className="gap-1">
          <HeaderText className="text-subText">{t`Volume`}</HeaderText>
          <span data-testid="earn-pool-row-volume">
            {formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}
          </span>
        </MobileTableCell>
        {showRewards && (
          <MobileTableCell justifyContent="space-between" alignItems="flex-start" className="gap-1">
            <HeaderText className="text-subText">{t`Rewards`}</HeaderText>
            <PoolRewardsInfo pool={pool} showEstimate={false} data-testid="earn-pool-row-rewards" />
          </MobileTableCell>
        )}
        <MobileTableCell data-testid="earn-pool-row-price">
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
