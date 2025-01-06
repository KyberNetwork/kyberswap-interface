import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import { usePoolDetailQuery } from 'services/poolService'

import { Swap as SwapIcon } from 'components/Icons'
import useTheme from 'hooks/useTheme'
import { formatDisplayNumber, toString } from 'utils/numbers'

import { ParsedPosition } from '.'
import LiquidityChart from './LiquidityChart'
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from './LiquidityChart/uniswapv3'
import { InfoRightColumn, InfoSection, InfoSectionSecondFormat, RevertIconWrapper } from './styles'

const RightSection = ({ position }: { position: ParsedPosition }) => {
  const theme = useTheme()
  const { data: pool } = usePoolDetailQuery({ chainId: position.chainId, ids: position.poolAddress })
  const [revert, setRevert] = useState(false)

  const price = useMemo(() => (!revert ? position.pairRate : 1 / position.pairRate), [position.pairRate, revert])

  const priceRange = useMemo(() => {
    if (!pool) return

    const tickSpacing = pool?.positionInfo.tickSpacing

    const minTick = nearestUsableTick(MIN_TICK, tickSpacing)
    const maxTick = nearestUsableTick(MAX_TICK, tickSpacing)
    const parsedMinPrice = toString(Number((!revert ? position.minPrice : 1 / position.maxPrice).toFixed(18)))
    const parsedMaxPrice = toString(Number((!revert ? position.maxPrice : 1 / position.minPrice).toFixed(18)))

    const tickLower =
      parsedMinPrice === '0'
        ? minTick
        : priceToClosestTick(parsedMinPrice, pool.tokens[0].decimals, pool.tokens[1].decimals, false)
    const tickUpper =
      Number(parsedMaxPrice) === Infinity
        ? maxTick
        : priceToClosestTick(parsedMaxPrice, pool.tokens[0].decimals, pool.tokens[1].decimals, false)

    const usableTickLower = nearestUsableTick(Number(tickLower), tickSpacing)
    const usableTickUpper = nearestUsableTick(Number(tickUpper), tickSpacing)

    if (usableTickLower === minTick && usableTickUpper === maxTick) return ['0', '∞']
    else
      return [
        formatDisplayNumber(parsedMinPrice, { significantDigits: 6 }),
        formatDisplayNumber(parsedMaxPrice, { significantDigits: 6 }),
      ]
  }, [pool, position, revert])

  if (!priceRange || !price) return null

  return (
    <InfoRightColumn>
      <InfoSection>
        <Flex alignItems={'center'} sx={{ gap: 1 }}>
          <Text fontSize={14} color={theme.subText}>
            {t`Current Price`}
          </Text>
          <Text fontSize={14}>
            {formatDisplayNumber(price, {
              significantDigits: 6,
            })}
          </Text>
          <Text fontSize={14} color={theme.subText}>
            {!revert ? position.token1Symbol : position.token0Symbol} per{' '}
            {!revert ? position.token0Symbol : position.token1Symbol}
          </Text>
          <RevertIconWrapper onClick={() => setRevert(!revert)}>
            <SwapIcon rotate={90} size={18} />
          </RevertIconWrapper>
        </Flex>
      </InfoSection>

      <LiquidityChart
        chainId={position.chainId}
        poolAddress={position.poolAddress}
        price={price}
        minPrice={position.minPrice}
        maxPrice={position.maxPrice}
        revertPrice={revert}
      />

      <Flex sx={{ gap: '16px' }}>
        <InfoSectionSecondFormat>
          <Text fontSize={14} color={theme.subText}>
            {t`Min Price`}
          </Text>
          <Text fontSize={18} marginBottom={2} marginTop={2}>
            {priceRange[0]}
          </Text>
          <Text fontSize={14} color={theme.subText}>
            {!revert ? position.token1Symbol : position.token0Symbol}/
            {!revert ? position.token0Symbol : position.token1Symbol}
          </Text>
        </InfoSectionSecondFormat>
        <InfoSectionSecondFormat>
          <Text fontSize={14} color={theme.subText}>
            {t`Max Price`}
          </Text>
          <Text fontSize={18} marginBottom={2} marginTop={2}>
            {priceRange[1]}
          </Text>
          <Text fontSize={14} color={theme.subText}>
            {!revert ? position.token1Symbol : position.token0Symbol}/
            {!revert ? position.token0Symbol : position.token1Symbol}
          </Text>
        </InfoSectionSecondFormat>
      </Flex>
    </InfoRightColumn>
  )
}

export default RightSection
