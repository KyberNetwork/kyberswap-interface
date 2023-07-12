import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { Eye, Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import { ElasticPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import { ButtonLight } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { formatUSDValue } from 'components/EarningAreaChart/utils'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import useTheme from 'hooks/useTheme'
import SinglePosition from 'pages/MyEarnings/ElasticPools/SinglePosition'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import ViewEarningOrPositionButton from 'pages/MyEarnings/PoolFilteringBar/ViewEarningOrPositionButton'
import { WIDTHS } from 'pages/MyEarnings/constants'
import { useAppSelector } from 'state/hooks'

const TitleWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
    align-items: initial;
    justify-content: initial;
  `}
`

const ListPositions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, 360px);
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  `}
`

type Props = {
  chainId: ChainId
  positionEarnings: ElasticPositionEarningWithDetails[]
  pool: Pool | undefined
  pendingFees: { [id: string]: [string, string] }
  tokenPrices: { [id: string]: number }
  currency0: Currency
  currency1: Currency
}
const Positions: React.FC<Props> = ({
  positionEarnings: unsortedPositionEarnings,
  chainId,
  pool,
  pendingFees,
  tokenPrices,
  currency0,
  currency1,
}) => {
  const [isViewEarnings, setViewEarnings] = useState(false)

  const getDefaultNumberPos = () => {
    const width = document.getElementById('my-earning-wrapper')?.offsetWidth || 1610

    let num = 1
    while (width > WIDTHS[num + 1]) {
      num += 1
    }

    return num
  }

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

  const { totalLiquidityBalance, liquidityValue0, liquidityValue1, positionEarnings } = useMemo(() => {
    if (!pool || !currency0 || !currency1) {
      return {
        totalLiquidityBalance: 0,
        liquidityValue0: undefined,
        liquidityValue1: undefined,
        positionEarnings: unsortedPositionEarnings,
      }
    }

    let total = 0
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

      total += liquidityInUsd

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

    return { totalLiquidityBalance: total, liquidityValue0, liquidityValue1, positionEarnings }
  }, [pool, unsortedPositionEarnings, tokenPrices, currency0, currency1])

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <TitleWrapper>
        <Flex
          alignItems="center"
          justifyContent="space-between"
          sx={{
            gap: '12px 16px',
            flexWrap: 'wrap',
          }}
        >
          <Text
            sx={{
              fontWeight: 500,
              fontSize: '20px',
              lineHeight: '24px',
            }}
          >
            My Liquidity Positions
          </Text>

          {liquidityValue0 && liquidityValue1 ? (
            <PoolLiquidityBalance total={totalLiquidityBalance} liq0={liquidityValue0} liq1={liquidityValue1} />
          ) : null}
        </Flex>

        <Flex
          sx={{
            alignItems: 'center',
            gap: '12px 16px',
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          <ViewEarningOrPositionButton isViewEarnings={isViewEarnings} setViewEarnings={setViewEarnings} />
          <PositionStats
            numOfActivePositions={numOfActivePositions}
            numOfInactivePositions={numOfInactivePositions}
            numOfClosedPositions={numOfClosedPositions}
          />
        </Flex>
      </TitleWrapper>

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

      {positionEarnings.length > 4 && (
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
    <Flex
      sx={{
        gap: '12px',
      }}
    >
      <Flex
        sx={{
          gap: '4px',
        }}
      >
        <Flex
          sx={{
            width: '16px',
            height: '16px',
            borderRadius: '999px',
            justifyContent: 'center',
            alignItems: 'center',
            background: rgba(theme.primary, 0.3),
          }}
        >
          <Info size={10} color={theme.primary} style={{ minWidth: '24px' }} />
        </Flex>
        <Text
          fontSize={14}
          fontWeight="500"
          width="max-content"
          as="span"
          sx={{
            whiteSpace: 'nowrap',
          }}
        >
          <Trans>{numOfActivePositions} Active</Trans>
        </Text>
      </Flex>

      {numOfInactivePositions ? (
        <Flex
          sx={{
            gap: '4px',
          }}
        >
          <Flex
            sx={{
              width: '16px',
              height: '16px',
              borderRadius: '999px',
              justifyContent: 'center',
              alignItems: 'center',
              background: rgba(theme.warning, 0.3),
            }}
          >
            <Info size={10} color={theme.warning} />
          </Flex>

          <Text
            fontSize={14}
            fontWeight="500"
            width="max-content"
            sx={{
              whiteSpace: 'nowrap',
            }}
          >
            <Trans>{numOfInactivePositions} Inactive</Trans>
          </Text>
        </Flex>
      ) : null}

      {numOfClosedPositions || shouldShowClosedPositions ? (
        <Flex
          sx={{
            gap: '4px',
            alignItems: 'center',
          }}
        >
          <Flex
            sx={{
              flex: '0 0 16px',
              height: '16px',
              borderRadius: '999px',
              justifyContent: 'center',
              alignItems: 'center',
              background: rgba(theme.red, 0.3),
            }}
          >
            <Info size={10} color={theme.red} />
          </Flex>

          <Flex
            sx={{
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              whiteSpace: 'nowrap',
              flex: '1 0 auto',
            }}
          >
            <Trans>{numOfClosedPositions} Closed</Trans>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}

function PoolLiquidityBalance({
  total,
  liq0,
  liq1,
}: {
  total: number
  liq0: CurrencyAmount<Currency>
  liq1: CurrencyAmount<Currency>
}) {
  const theme = useTheme()
  return (
    <Flex
      alignItems="center"
      sx={{
        gap: '8px',
      }}
    >
      <Text
        sx={{
          fontSize: '14px',
          fontWeight: 500,
          color: theme.subText,
        }}
      >
        <Trans>My Liquidity Balance</Trans>
      </Text>
      <HoverDropdown
        anchor={
          <Text
            sx={{
              fontSize: '20px',
              fontWeight: 500,
              lineHeight: '28px',
              whiteSpace: 'nowrap',
            }}
          >
            {formatUSDValue(total)}
          </Text>
        }
        disabled={!total}
        text={
          <>
            <Flex alignItems="center">
              <CurrencyLogo currency={liq0.currency} size="16px" />
              <Text fontSize={12} marginLeft="4px">
                {liq0 && <FormattedCurrencyAmount currencyAmount={liq0} />}
              </Text>
            </Flex>
            <Flex alignItems="center" marginTop="8px">
              <CurrencyLogo currency={liq1.currency} size="16px" />
              <Text fontSize={12} marginLeft="4px">
                {liq1 && <FormattedCurrencyAmount currencyAmount={liq1} />}
              </Text>
            </Flex>
          </>
        }
      />
    </Flex>
  )
}

export default Positions
