import { formatAprNumber } from '@kyber/utils/dist/number'
import { MAX_TICK } from '@kyber/utils/dist/uniswapv3'
import { t } from '@lingui/macro'
import { Star } from 'react-feather'
import { Flex, Text } from 'rebass'
import { PoolQueryParams } from 'services/zapEarn'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import { ReactComponent as UniBonusIcon } from 'assets/svg/kyber/uni_bonus.svg'
import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import SparklineChart from 'pages/Earns/PoolExplorer/SparklineChart'
import { Apr, FeeTier, SymbolText, TableCell, TableRow } from 'pages/Earns/PoolExplorer/styles'
import AprDetailTooltip from 'pages/Earns/components/AprDetailTooltip'
import MerklAprInfo from 'pages/Earns/components/MerklAprInfo'
import MerklRewardsRecord from 'pages/Earns/components/MerklRewardsRecord'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import { ParsedEarnPool, ProgramType } from 'pages/Earns/types'
import { isUniswapExchange } from 'pages/Earns/utils'
import { formatDisplayNumber } from 'utils/numbers'

export const kemFarming = (pool: ParsedEarnPool) => {
  const programs = pool.programs || []
  const isFarming = programs.includes(ProgramType.EG) || programs.includes(ProgramType.LM)
  const isFarmingLm = programs.includes(ProgramType.LM)

  return isFarming ? (
    <AprDetailTooltip feeApr={pool.lpApr} egApr={pool.kemEGApr} lmApr={pool.kemLMApr}>
      {isFarmingLm ? (
        <FarmingLmIcon width={24} height={24} style={{ marginLeft: 4 }} />
      ) : (
        <FarmingIcon width={24} height={24} style={{ marginLeft: 4 }} />
      )}
    </AprDetailTooltip>
  ) : null
}

/** @deprecated TODO: Remove when completely integrate merklOpportunity */
export const uniReward = (pool: ParsedEarnPool) => {
  const hasReward = isUniswapExchange(pool.exchange) && pool.bonusApr && pool.bonusApr > 0

  return hasReward ? (
    <AprDetailTooltip uniApr={pool.bonusApr}>
      <UniBonusIcon width={24} height={24} style={{ marginLeft: 4 }} />
    </AprDetailTooltip>
  ) : null
}

const DesktopTableRow = ({
  pool,
  filters,
  onOpenZapInWidget,
  handleFavorite,
  favoriteLoading,
}: {
  pool: ParsedEarnPool
  filters: PoolQueryParams
  onOpenZapInWidget: ({ pool, initialTick }: ZapInInfo) => void
  handleFavorite: (e: React.MouseEvent<SVGElement, MouseEvent>, pool: ParsedEarnPool) => Promise<void>
  favoriteLoading: string[]
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
    <TableRow expandColumn={isFarmingFiltered} onClick={e => handleOpenZapInWidget(e)}>
      <TableCell alignItems="flex-start">
        <Flex alignItems="center" sx={{ gap: 2 }}>
          <Flex alignItems="flex-end" sx={{ position: 'relative' }}>
            <TokenLogo src={pool.tokens?.[0]?.logoURI} />
            <TokenLogo src={pool.tokens?.[1]?.logoURI} translateLeft />
            {pool.chain?.logoUrl && <TokenLogo src={pool.chain.logoUrl} size={12} translateLeft translateTop />}
          </Flex>
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
        </Flex>
        <Flex alignItems="center" fontSize={14} sx={{ gap: 1 }}>
          <TokenLogo src={pool.dexLogo} size={18} />
          <Text color={theme.subText}>{pool.dexName}</Text>
        </Flex>
      </TableCell>
      <TableCell alignItems="flex-start">
        <Apr value={pool.allApr}>
          {formatAprNumber(pool.allApr)}% {kemFarming(pool)}
        </Apr>
        <MerklAprInfo pool={pool} />
      </TableCell>
      <TableCell alignItems="flex-start">
        <Text>
          {formatDisplayNumber((pool.egUsd || 0) + rewardsTotalUsd, { style: 'currency', significantDigits: 4 })}
        </Text>
        <MerklRewardsRecord pool={pool} />
      </TableCell>
      {isFarmingFiltered && (
        <TableCell alignItems="flex-end" onClick={e => handleOpenZapInWidget(e, true)}>
          {!!pool.maxAprInfo && (
            <MouseoverTooltipDesktopOnly
              text={
                t`Add liquidity with price range:` +
                ` ${
                  pool.maxAprInfo.minPrice
                    ? formatDisplayNumber(pool.maxAprInfo.minPrice, { significantDigits: 6 })
                    : '--'
                }` +
                ` - ${
                  pool.maxAprInfo.tickUpper === MAX_TICK
                    ? '∞'
                    : pool.maxAprInfo.maxPrice
                    ? formatDisplayNumber(pool.maxAprInfo.maxPrice, { significantDigits: 6 })
                    : '--'
                }`
              }
              width="fit-content"
              placement="bottom"
            >
              <Text>
                {formatAprNumber(
                  Number(pool.maxAprInfo.apr) +
                    Number(pool.maxAprInfo.kemEGApr) +
                    Number(pool.maxAprInfo.kemLMApr) +
                    Number(pool.bonusApr || 0),
                ) + '%'}
              </Text>
            </MouseoverTooltipDesktopOnly>
          )}
        </TableCell>
      )}
      <TableCell alignItems="flex-end">
        <Text>
          {formatDisplayNumber(isFarmingFiltered ? pool.egUsd : pool.earnFee, {
            style: 'currency',
            significantDigits: 6,
          })}
        </Text>
      </TableCell>
      <TableCell alignItems="flex-end">
        <Text>{formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}</Text>
      </TableCell>
      <TableCell alignItems="flex-end">
        <Text>{formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}</Text>
      </TableCell>
      <TableCell alignItems="center">
        <SparklineChart sparkline={pool.sparkline} shouldInvert={pool.sparklinePriceToken !== pool.tokens[1].address} />
      </TableCell>
      <TableCell alignItems="flex-end">
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
