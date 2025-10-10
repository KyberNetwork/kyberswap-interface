import { formatAprNumber } from '@kyber/utils/dist/number'
import { Star } from 'react-feather'
import { Flex, Text } from 'rebass'
import { PoolQueryParams } from 'services/zapEarn'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import { Apr, FeeTier, SymbolText, TableRow } from 'pages/Earns/PoolExplorer/styles'
import AprDetailTooltip from 'pages/Earns/components/AprDetailTooltip'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import { ParsedEarnPool, ProgramType } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

export const kemFarming = (pool: ParsedEarnPool) => {
  const programs = pool.programs || []
  const isFarming = programs.includes(ProgramType.EG) || programs.includes(ProgramType.LM)
  const isFarmingLm = programs.includes(ProgramType.LM)

  return isFarming ? (
    <AprDetailTooltip feeApr={pool.feeApr} egApr={pool.kemEGApr || 0} lmApr={pool.kemLMApr || 0}>
      {isFarmingLm ? (
        <FarmingLmIcon width={24} height={24} style={{ marginLeft: 4 }} />
      ) : (
        <FarmingIcon width={24} height={24} style={{ marginLeft: 4 }} />
      )}
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
    <TableRow expandColumn={isFarmingFiltered} onClick={e => handleOpenZapInWidget(e)}>
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
      {isFarmingFiltered && (
        <Flex justifyContent="flex-end" onClick={e => handleOpenZapInWidget(e, true)}>
          <MouseoverTooltipDesktopOnly
            text={
              pool.maxAprInfo
                ? `Add liquidity with price range: ${
                    pool.maxAprInfo.minPrice
                      ? formatDisplayNumber(pool.maxAprInfo.minPrice, { significantDigits: 6 })
                      : '--'
                  } - ${
                    pool.maxAprInfo.maxPrice
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
                  Number(pool.maxAprInfo.apr || 0) +
                    Number(pool.maxAprInfo.kemEGApr || 0) +
                    Number(pool.maxAprInfo.kemLMApr || 0),
                ) + '%'
              : ''}
          </MouseoverTooltipDesktopOnly>
        </Flex>
      )}
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
  )
}

export default DesktopTableRow
