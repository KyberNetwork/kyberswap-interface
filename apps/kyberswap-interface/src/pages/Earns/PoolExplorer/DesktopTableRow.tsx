import { formatAprNumber } from '@kyber/utils/dist/number'
import { MAX_TICK } from '@kyber/utils/dist/uniswapv3'
import { t } from '@lingui/macro'
import { useMemo } from 'react'
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
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import { Apr, FeeTier, RowItem, SymbolText, TableRow } from 'pages/Earns/PoolExplorer/styles'
import AprDetailTooltip from 'pages/Earns/components/AprDetailTooltip'
import MerklAprInfo from 'pages/Earns/components/MerklAprInfo'
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
  const isFarmingFiltered = filters.tag === FilterTag.FARMING_POOL

  const handleOpenZapInWidget = (e: React.MouseEvent<HTMLDivElement>, withPriceRange?: boolean) => {
    e.stopPropagation()
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

  const activeCampaigns = useMemo(() => {
    const currentTimestamp = Date.now() / 1000
    return (pool.merklOpportunity?.campaigns ?? []).filter(
      campaign => campaign.startTimestamp <= currentTimestamp && campaign.endTimestamp >= currentTimestamp,
    )
  }, [pool])

  return (
    <TableRow expandColumn={isFarmingFiltered} onClick={e => handleOpenZapInWidget(e)}>
      <RowItem>
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
            text={activeCampaigns.length > 0 ? `${t`Active Incentive Campaigns:`} ${activeCampaigns.length}` : ''}
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
      </RowItem>
      <RowItem>
        <Apr value={pool.allApr}>
          {formatAprNumber(pool.allApr)}% {kemFarming(pool)}
        </Apr>
        <MerklAprInfo pool={pool} />
      </RowItem>
      {isFarmingFiltered && (
        <RowItem alignItems="flex-end" onClick={e => handleOpenZapInWidget(e, true)}>
          <MouseoverTooltipDesktopOnly
            text={
              pool.maxAprInfo
                ? t`Add liquidity with price range:` +
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
                : ''
            }
            width="fit-content"
            placement="bottom"
          >
            {pool.maxAprInfo
              ? formatAprNumber(
                  Number(pool.maxAprInfo.apr) + Number(pool.maxAprInfo.kemEGApr) + Number(pool.maxAprInfo.kemLMApr),
                ) + '%'
              : ''}
          </MouseoverTooltipDesktopOnly>
        </RowItem>
      )}
      <RowItem alignItems="flex-end">
        {formatDisplayNumber(isFarmingFiltered ? pool.egUsd : pool.earnFee, {
          style: 'currency',
          significantDigits: 6,
        })}
      </RowItem>
      <RowItem alignItems="flex-end">
        {formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}
      </RowItem>
      <RowItem alignItems="flex-end">
        {formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}
      </RowItem>
      <RowItem alignItems="flex-end">
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
      </RowItem>
    </TableRow>
  )
}

export default DesktopTableRow
