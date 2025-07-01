import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import { usePoolDetailQuery } from 'services/poolService'

import { Swap as SwapIcon } from 'components/Icons'
import { NativeCurrencies } from 'constants/tokens'
import { useStableCoins } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import LiquidityChart from 'pages/Earns/PositionDetail/LiquidityChart'
import PositionHistory from 'pages/Earns/PositionDetail/PositionHistory'
import {
  InfoRightColumn,
  InfoSection,
  InfoSectionSecondFormat,
  RevertIconWrapper,
} from 'pages/Earns/PositionDetail/styles'
import { CoreProtocol, EarnDex } from 'pages/Earns/constants'
import { ParsedPosition } from 'pages/Earns/types'
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from 'pages/Earns/uniswapv3'
import { isForkFrom } from 'pages/Earns/utils'
import { formatDisplayNumber, toString } from 'utils/numbers'

const RightSection = ({ position }: { position: ParsedPosition }) => {
  const theme = useTheme()
  const { stableCoins } = useStableCoins(position.chainId)
  const { data: pool } = usePoolDetailQuery({ chainId: position.chainId, ids: position.poolAddress })
  const [revert, setRevert] = useState(false)
  const [defaultRevertChecked, setDefaultRevertChecked] = useState(false)

  const price = useMemo(() => (!revert ? position.pairRate : 1 / position.pairRate), [position.pairRate, revert])
  const isUniv2 = isForkFrom(position.dex as EarnDex, CoreProtocol.UniswapV2)

  const priceRange = useMemo(() => {
    if (!pool) return

    const tickSpacing = pool?.positionInfo.tickSpacing
    const minTick = nearestUsableTick(MIN_TICK, tickSpacing)
    const maxTick = nearestUsableTick(MAX_TICK, tickSpacing)

    if (minTick === undefined || maxTick === undefined) return

    const minPrice = toString(Number(position.minPrice.toFixed(18)))
    const maxPrice = toString(Number(position.maxPrice.toFixed(18)))

    const tickLower =
      minPrice === '0' ? minTick : priceToClosestTick(minPrice, pool.tokens[0].decimals, pool.tokens[1].decimals, false)
    const tickUpper = priceToClosestTick(maxPrice, pool.tokens[0].decimals, pool.tokens[1].decimals, false)

    const usableTickLower = nearestUsableTick(Number(tickLower), tickSpacing)
    const usableTickUpper = nearestUsableTick(Number(tickUpper), tickSpacing)

    if (usableTickLower === undefined || usableTickUpper === undefined) return
    if (usableTickLower === minTick && usableTickUpper === maxTick) return ['0', '∞']
    else {
      const parsedMinPrice = toString(Number((!revert ? position.minPrice : 1 / position.maxPrice).toFixed(18)))
      const parsedMaxPrice = toString(Number((!revert ? position.maxPrice : 1 / position.minPrice).toFixed(18)))
      return [
        formatDisplayNumber(parsedMinPrice, { significantDigits: 6 }),
        formatDisplayNumber(parsedMaxPrice, { significantDigits: 6 }),
      ]
    }
  }, [pool, position, revert])

  useEffect(() => {
    if (!pool || !position.chainId || !pool.tokens?.[0] || defaultRevertChecked || !stableCoins.length) return
    setDefaultRevertChecked(true)
    const isToken0Native =
      pool.tokens[0].address.toLowerCase() ===
      NativeCurrencies[position.chainId as ChainId].wrapped.address.toLowerCase()
    const isToken0Stable = stableCoins.some(coin => coin.address === pool.tokens[0].address)
    const isToken1Stable = stableCoins.some(coin => coin.address === pool.tokens[1].address)
    if (isToken0Stable || (isToken0Native && !isToken1Stable)) setRevert(true)
  }, [defaultRevertChecked, pool, position.chainId, stableCoins])

  return (
    <InfoRightColumn halfWidth={isUniv2}>
      {price ? (
        <InfoSection>
          <Flex alignItems={'center'} sx={{ gap: 1 }} flexWrap={'wrap'}>
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
              <SwapIcon size={18} />
            </RevertIconWrapper>
          </Flex>
        </InfoSection>
      ) : null}

      <LiquidityChart
        chainId={position.chainId}
        poolAddress={position.poolAddress}
        price={price}
        minPrice={position.minPrice}
        maxPrice={position.maxPrice}
        revertPrice={revert}
      />

      {priceRange ? (
        <Flex sx={{ gap: '16px' }}>
          <InfoSectionSecondFormat>
            <Text fontSize={14} color={theme.subText}>
              {t`Min Price`}
            </Text>
            <Text fontSize={18} marginBottom={2} marginTop={2}>
              {priceRange[0]}
            </Text>
            <Text fontSize={14} color={theme.subText}>
              {!revert ? position.token0Symbol : position.token1Symbol}/
              {!revert ? position.token1Symbol : position.token0Symbol}
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
              {!revert ? position.token0Symbol : position.token1Symbol}/
              {!revert ? position.token1Symbol : position.token0Symbol}
            </Text>
          </InfoSectionSecondFormat>
        </Flex>
      ) : null}

      {isUniv2 && <PositionHistory position={position} />}
    </InfoRightColumn>
  )
}

export default RightSection
