import { FeeAmount, Pool, TICK_SPACINGS, TickMath, nearestUsableTick, tickToPrice } from '@kyberswap/ks-sdk-elastic'
import { useMemo, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Down } from 'assets/svg/down.svg'
import { FeeSelectorWrapper, SelectWrapper, SelectWrapperOuter } from 'components/FeeSelector'
import { TwoWayArrow } from 'components/Icons'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { RANGE_LIST, rangeData } from 'pages/AddLiquidityV2/constants'
import { Bound, RANGE } from 'state/mint/proamm/type'
import { getRangeTicks } from 'state/mint/proamm/utils'
import { usePairFactor } from 'state/topTokens/hooks'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

const StyledSelectWrapperOuter = styled(SelectWrapperOuter)`
  background: ${({ theme }) => theme.buttonGray};
`

const Option = styled.div`
  padding: 12px;
  cursor: pointer;

  :hover {
    background: ${({ theme }) => theme.buttonBlack};
  }
`
const defaultFee = FeeAmount.MOST_PAIR

export const useTicksFromRange = (range: RANGE, pool?: Pool): [number, number] => {
  const pairFactor = usePairFactor([pool?.token0, pool?.token1])

  const tickSpaceLimits: {
    [bound in Bound]: number
  } = useMemo(
    () => ({
      [Bound.LOWER]: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[pool?.fee || defaultFee]),
      [Bound.UPPER]: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[pool?.fee || defaultFee]),
    }),
    [pool?.fee],
  )

  const isFullRange = range === RANGE.FULL_RANGE

  return isFullRange
    ? [tickSpaceLimits.LOWER, tickSpaceLimits.UPPER]
    : pool
    ? (getRangeTicks(range, pool.token0, pool.token1, pool.tickCurrent, pairFactor).map(item =>
        nearestUsableTick(item, TICK_SPACINGS[pool?.fee || defaultFee]),
      ) as unknown as [number, number])
    : [0, 0]
}
export default function RangeSelector({
  pool,
  selectedRange,
  onChange,
}: {
  pool: Pool
  selectedRange: RANGE
  onChange: (range: RANGE) => void
}) {
  const [show, setShow] = useState(false)

  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setShow(false)
  })

  const symbol0 = getTokenSymbolWithHardcode(
    pool.token0.chainId,
    pool.token0.address,
    unwrappedToken(pool.token0).symbol,
  )
  const symbol1 = getTokenSymbolWithHardcode(
    pool.token1.chainId,
    pool.token1.address,
    unwrappedToken(pool.token1).symbol,
  )

  const [tickLower, tickUpper] = useTicksFromRange(selectedRange, pool)
  const isFullRange = selectedRange === RANGE.FULL_RANGE
  const parsedLower = tickToPrice(pool.token0, pool.token1, tickLower)
  const parsedUpper = tickToPrice(pool.token0, pool.token1, tickUpper)

  const pairFactor = usePairFactor([pool.token0, pool.token1])
  const tickSpaceLimits: {
    [bound in Bound]: number
  } = useMemo(
    () => ({
      [Bound.LOWER]: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[pool.fee]),
      [Bound.UPPER]: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[pool.fee]),
    }),
    [pool.fee],
  )

  return (
    <FeeSelectorWrapper role="button" onClick={() => setShow(prev => !prev)} ref={ref}>
      <div>
        <Text fontSize={12} fontWeight="500">
          {rangeData[selectedRange].title}
        </Text>
        <Flex fontSize={12} marginTop="8px" sx={{ gap: '4px' }}>
          <Text color={theme.subText}>
            Range ({symbol0}/{symbol1}):
          </Text>

          <Text>{isFullRange ? '0' : parsedLower.toSignificant(6)}</Text>
          <TwoWayArrow />
          <Text>{isFullRange ? '∞' : parsedUpper.toSignificant(6)}</Text>
        </Flex>
      </div>

      <Down style={{ transform: `rotate(${show ? '-180deg' : 0})`, transition: 'transform 0.15s' }} />
      <StyledSelectWrapperOuter show={show}>
        <SelectWrapper show={show}>
          {RANGE_LIST.map(item => {
            const fullrange = item === RANGE.FULL_RANGE
            const [tickLower, tickUpper] = fullrange
              ? [tickSpaceLimits.LOWER, tickSpaceLimits.UPPER]
              : getRangeTicks(item, pool.token0, pool.token1, pool.tickCurrent, pairFactor)

            const parsedLower = tickToPrice(pool.token0, pool.token1, tickLower)
            const parsedUpper = tickToPrice(pool.token0, pool.token1, tickUpper)

            return (
              <Option key={item} role="button" onClick={() => onChange(item)}>
                <Text fontSize={12} fontWeight="500">
                  {rangeData[item].title}
                </Text>
                <Flex fontSize={12} marginTop="8px" sx={{ gap: '4px' }}>
                  <Text color={theme.subText}>
                    Range ({symbol0}/{symbol1}):
                  </Text>
                  <Text>{fullrange ? '0' : parsedLower.toSignificant(6)}</Text>
                  <TwoWayArrow />
                  <Text>{fullrange ? '∞' : parsedUpper.toSignificant(6)}</Text>
                </Flex>
              </Option>
            )
          })}
        </SelectWrapper>
      </StyledSelectWrapperOuter>
    </FeeSelectorWrapper>
  )
}
