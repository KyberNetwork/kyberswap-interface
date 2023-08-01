import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { Eye, Info } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { ElasticPoolEarningWithDetails, ElasticPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import { ButtonLight } from 'components/Button'
import useTheme from 'hooks/useTheme'
import SinglePosition from 'pages/MyEarnings/ElasticPools/SinglePosition'
import ViewEarningOrPositionButton from 'pages/MyEarnings/PoolFilteringBar/ViewEarningOrPositionButton'
import { WIDTHS } from 'pages/MyEarnings/constants'
import { useAppSelector } from 'state/hooks'
import { useShowMyEarningChart } from 'state/user/hooks'

import PoolEarningsSection from './PoolEarningsSection'

const ListPositions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, 360px);
  gap: 1rem;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: flex;
    flex-direction: column;
    align-items: center;
  `}
`

type Props = {
  poolEarning: ElasticPoolEarningWithDetails
  chainId: ChainId
  positionEarnings: ElasticPositionEarningWithDetails[]
  pool: Pool | undefined
  pendingFees: { [id: string]: [string, string] }
  tokenPrices: { [id: string]: number }
  currency0: Currency
  currency1: Currency
}

const getDefaultNumberPos = () => {
  const width = document.getElementById('my-earning-wrapper')?.offsetWidth || 1610
  let num = 1
  while (width >= WIDTHS[num + 1]) {
    num += 1
  }
  return num
}

const Positions: React.FC<Props> = ({
  poolEarning,
  positionEarnings: unsortedPositionEarnings,
  chainId,
  pool,
  pendingFees,
  tokenPrices,
  currency0,
  currency1,
}) => {
  const [isViewEarnings, setViewEarnings] = useState(false)
  const [numberOfVisiblePositions, setNumberOfVisiblePositions] = useState(getDefaultNumberPos())

  const [numOfActivePositions, numOfInactivePositions, numOfClosedPositions] = useMemo(() => {
    const nClosed = unsortedPositionEarnings.filter(pos => !pos.liquidity || pos.liquidity === '0').length
    const nActive = unsortedPositionEarnings.filter(pos => {
      const isNotClosed = pos.liquidity && pos.liquidity !== '0'
      const isActive = Number(pos.tickLower) <= Number(pos.pool.tick) && Number(pos.pool.tick) < Number(pos.tickUpper)

      return isNotClosed && isActive
    }).length

    return [nActive, unsortedPositionEarnings.length - nClosed - nActive, nClosed]
  }, [unsortedPositionEarnings])

  const positionEarnings = useMemo(() => {
    if (!pool || !currency0 || !currency1) {
      return unsortedPositionEarnings
    }

    let liquidityValue0 = CurrencyAmount.fromRawAmount(currency0, 0)
    let liquidityValue1 = CurrencyAmount.fromRawAmount(currency1, 0)
    const token0Price = tokenPrices[currency0.wrapped.address || '']
    const token1Price = tokenPrices[currency1.wrapped.address || '']

    const positionEarningsWithLiquidityUSD: Array<{
      positionEarning: ElasticPositionEarningWithDetails
      liquidityInUsd: number
    }> = []

    const closedPositionEarnings = unsortedPositionEarnings
      .filter(position => !position.liquidity || position.liquidity === '0')
      // sort closed positions by nft id, desc
      .sort((p1, p2) => Number(p2.id) - Number(p1.id))

    const openPositionEarnings = unsortedPositionEarnings.filter(
      position => position.liquidity && position.liquidity !== '0',
    )

    openPositionEarnings.forEach(positionEarning => {
      const position = new Position({
        pool,
        liquidity: positionEarning.liquidity,
        tickLower: Number(positionEarning.tickLower),
        tickUpper: Number(positionEarning.tickUpper),
      })

      const liquidityInUsd =
        parseFloat(position.amount0.toExact() || '0') * token0Price +
        parseFloat(position.amount1.toExact() || '0') * token1Price

      liquidityValue0 = liquidityValue0.add(CurrencyAmount.fromRawAmount(currency0, position.amount0.quotient))
      liquidityValue1 = liquidityValue1.add(CurrencyAmount.fromRawAmount(currency1, position.amount1.quotient))

      positionEarningsWithLiquidityUSD.push({
        positionEarning,
        liquidityInUsd,
      })
    })

    const positionEarnings = positionEarningsWithLiquidityUSD
      // sort open positions by liquidity usd
      .sort((v1, v2) => v2.liquidityInUsd - v1.liquidityInUsd)
      .map(({ positionEarning }) => positionEarning)
      .concat(closedPositionEarnings)

    return positionEarnings
  }, [pool, unsortedPositionEarnings, tokenPrices, currency0, currency1])

  const theme = useTheme()
  const [showEarningChart] = useShowMyEarningChart()
  const mobileView = useMedia(`(max-width: ${WIDTHS[2]}px)`)

  return (
    <Flex
      flexDirection="column"
      backgroundColor={mobileView ? 'transparent' : theme.background}
      padding={mobileView ? '1rem 0' : '1rem'}
      margin={mobileView ? 0 : '0 0.75rem 0.75rem'}
      sx={{ borderRadius: '1rem', gap: '1rem' }}
    >
      <Text fontSize={16} fontWeight="500">
        <Trans>My Liquidity Positions</Trans>
      </Text>

      {showEarningChart && <PoolEarningsSection historicalEarning={poolEarning.historicalEarning} chainId={chainId} />}

      <Flex
        justifyContent="space-between"
        alignItems="center"
        flexDirection={mobileView ? 'column' : 'row'}
        sx={{ gap: '0.75rem' }}
      >
        <ViewEarningOrPositionButton isViewEarnings={isViewEarnings} setViewEarnings={setViewEarnings} />
        <PositionStats
          numOfActivePositions={numOfActivePositions}
          numOfInactivePositions={numOfInactivePositions}
          numOfClosedPositions={numOfClosedPositions}
        />
      </Flex>

      <ListPositions>
        {positionEarnings.slice(0, numberOfVisiblePositions).map(positionEarning => (
          <SinglePosition
            chainId={chainId}
            key={positionEarning.id}
            positionEarning={positionEarning}
            pool={pool}
            pendingFee={pendingFees[positionEarning.id]}
            tokenPrices={tokenPrices}
            isInitiallyViewEarnings={isViewEarnings}
            currency0={currency0}
            currency1={currency1}
          />
        ))}
      </ListPositions>

      {positionEarnings.length > getDefaultNumberPos() && (
        <ButtonLight
          onClick={() => {
            setNumberOfVisiblePositions(
              numberOfVisiblePositions < positionEarnings.length ? positionEarnings.length : getDefaultNumberPos(),
            )
          }}
          style={{
            gap: '4px',
            alignItems: 'center',
            padding: 0,
            height: '36px',
          }}
        >
          <Eye size={16} />
          {numberOfVisiblePositions < positionEarnings.length ? (
            <span>
              <Trans>View All</Trans> ({positionEarnings.length - numberOfVisiblePositions})
            </span>
          ) : (
            <Trans>View Less</Trans>
          )}
        </ButtonLight>
      )}
    </Flex>
  )
}

const IconWrapper = styled.div<{ color: string }>`
  border-radius: 50%;
  width: 16px;
  height: 16px;
  background: ${({ color }) => rgba(color, 0.2)};
  color: ${({ color }) => color};
  display: flex;
  justify-content: center;
  align-items: center;
`

function PositionStats({
  numOfActivePositions,
  numOfInactivePositions,
  numOfClosedPositions,
}: {
  numOfActivePositions: number
  numOfInactivePositions: number
  numOfClosedPositions: number
}) {
  const theme = useTheme()
  const shouldShowClosedPositions = useAppSelector(state => state.myEarnings.shouldShowClosedPositions)

  return (
    <Flex sx={{ gap: '1rem' }}>
      <Flex sx={{ gap: '4px' }}>
        <IconWrapper color={theme.primary}>
          <Info size={10} />
        </IconWrapper>
        <Text fontSize={14} fontWeight="500">
          <Trans>{numOfActivePositions} Active</Trans>
        </Text>
      </Flex>

      {numOfInactivePositions ? (
        <Flex sx={{ gap: '4px' }}>
          <IconWrapper color={theme.warning}>
            <Info size={10} />
          </IconWrapper>
          <Text fontSize={14} fontWeight="500">
            <Trans>{numOfInactivePositions} Inactive</Trans>
          </Text>
        </Flex>
      ) : null}

      {numOfClosedPositions || shouldShowClosedPositions ? (
        <Flex sx={{ gap: '4px' }}>
          <IconWrapper color={theme.red}>
            <Info size={10} />
          </IconWrapper>
          <Text fontSize={14} fontWeight="500">
            <Trans>{numOfClosedPositions} Closed</Trans>
          </Text>
        </Flex>
      ) : null}
    </Flex>
  )
}

export default Positions
