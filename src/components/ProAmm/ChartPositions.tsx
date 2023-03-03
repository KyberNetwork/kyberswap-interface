import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as DoubleArrow } from 'assets/svg/double_arrow.svg'
import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import CurrencyLogo from 'components/CurrencyLogo'
import MultipleLiquiditiesChart from 'components/MultipleLiquiditiesChart'
import { ClickableText } from 'components/YieldPools/styleds'
import useTheme from 'hooks/useTheme'
import { Bound } from 'state/mint/proamm/type'
import { MEDIA_WIDTHS } from 'theme'
import { formattedNum } from 'utils'
import { formatTickPrice } from 'utils/formatTickPrice'
import { getTickToPrice } from 'utils/getTickToPrice'

import Tabs from './Tab'

const ContentWrapper = styled.div`
  margin-top: 1rem;
  max-height: calc(85vh - 300px);
  border-radius: 20px;
  overflow: hidden;
`

const BodyWrapper = styled.div`
  padding: 12px 16px 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
`

const tableTemplateColumns = css`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 1fr 1.5fr 1.5fr 2.5fr;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr 3fr;
  `};
`

const TableHeader = styled.div`
  ${tableTemplateColumns}
  padding: 0 16px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  text-align: right;
`

const TableRowWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  position: relative;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`
const TableRow = styled.div`
  ${tableTemplateColumns}
  width: 100%;
`

const RowItem = styled(Flex)`
  flex-direction: column;
`

const PositionListItem = ({
  position,
  usdPrices,
  ticksAtLimit,
  rotated,
}: {
  position: Position
  usdPrices: {
    [address: string]: number
  }
  ticksAtLimit: {
    [bound in Bound]: boolean | undefined
  }
  rotated: boolean
}) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const [isExpanded, setIsExpanded] = useState(false)
  const theme = useTheme()
  const [tokenA, tokenB] = rotated
    ? [position.amount1.currency, position.amount0.currency]
    : [position.amount0.currency, position.amount1.currency]
  const usdValue =
    parseFloat(position.amount0.toSignificant(6)) * usdPrices[tokenA.address] +
    parseFloat(position.amount1.toSignificant(6)) * usdPrices[tokenB.address]
  const priceLower = getTickToPrice(tokenA, tokenB, position.tickLower)
  const priceUpper = getTickToPrice(tokenA, tokenB, position.tickUpper)
  const formattedLowerPrice = formatTickPrice(priceLower, ticksAtLimit, Bound.LOWER)
  const formattedUpperPrice = formatTickPrice(priceUpper, ticksAtLimit, Bound.UPPER)
  if (!priceLower || !priceUpper) return null

  return (
    <TableRowWrapper>
      <TableRow>
        <RowItem>{formattedNum(usdValue.toString(), true)}</RowItem>

        {upToSmall ? null : (
          <>
            <RowItem>
              <Flex sx={{ gap: '4px' }} alignItems="center">
                <CurrencyLogo currency={position.amount0.currency} size="16px" />
                <Text>
                  {position.amount0.toSignificant(4)} {position.amount0.currency.symbol}
                </Text>
              </Flex>
            </RowItem>
            <RowItem>
              <Flex sx={{ gap: '4px' }} alignItems="center">
                <CurrencyLogo currency={position.amount1.currency} size="16px" />
                <Text>
                  {position.amount1.toSignificant(4)} {position.amount1.currency.symbol}
                </Text>
              </Flex>
            </RowItem>
          </>
        )}
        <Flex sx={{ gap: '8px' }} width="100%" alignItems="center" justifyContent="right">
          {formattedLowerPrice} <DoubleArrow /> {formattedUpperPrice}
          {upToSmall && (
            <ClickableText onClick={() => setIsExpanded(!isExpanded)}>
              <DropdownSVG
                style={{ transform: `rotate(${isExpanded ? '-180deg' : 0}) scale(1.5)`, transition: 'transform 0.15s' }}
              />
            </ClickableText>
          )}
        </Flex>
      </TableRow>
      {isExpanded && upToSmall && (
        <Flex flexDirection="column" width="100%" sx={{ gap: '12px' }}>
          <Flex justifyContent="space-between">
            <Flex sx={{ gap: '8px' }}>
              <Flex sx={{ gap: '4px' }} alignItems="center">
                <CurrencyLogo currency={position.amount0.currency} size="16px" />
                <Text>
                  {position.amount0.toSignificant(4)} {position.amount0.currency.symbol}
                </Text>
              </Flex>
            </Flex>
            <Flex sx={{ gap: '8px' }}>
              <Flex sx={{ gap: '4px' }} alignItems="center">
                <CurrencyLogo currency={position.amount1.currency} size="16px" />
                <Text>
                  {position.amount1.toSignificant(4)} {position.amount1.currency.symbol}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex justifyContent="space-between">
            <Flex>
              <Text color={theme.subText}>
                <Trans>PRICE RANGE</Trans>
              </Text>
            </Flex>
            <Flex>
              <Text>
                {formattedLowerPrice} <DoubleArrow /> {formattedUpperPrice}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      )}
    </TableRowWrapper>
  )
}

const ChartPositions = ({
  positions,
  usdPrices,
  rotated,
  ticksAtLimits,
}: {
  positions: Position[]
  usdPrices: {
    [address: string]: number
  }
  ticksAtLimits: {
    [bound in Bound]: (boolean | undefined)[]
  }
  rotated: boolean
}) => {
  const [positionIndex, setPositionIndex] = useState(0)
  const pIndex = positionIndex >= positions.length ? positions.length - 1 : positionIndex
  const [tokenA, tokenB] = rotated
    ? [positions[0].amount1.currency, positions[0].amount0.currency]
    : [positions[0].amount0.currency, positions[0].amount1.currency]
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const header = (
    <TableHeader>
      <RowItem alignItems="flex-start">
        <Trans>VALUE</Trans>
      </RowItem>

      {upToSmall ? null : (
        <>
          <RowItem alignItems="flex-start">{positions[0].amount0.currency.symbol}</RowItem>
          <RowItem alignItems="flex-start">{positions[0].amount1.currency.symbol}</RowItem>
        </>
      )}

      <RowItem alignItems="flex-end">
        <Trans>
          <Text>
            PRICE RANGE{' '}
            <Text as="span" sx={{ whiteSpace: 'nowrap' }}>
              ({tokenB.symbol} per {tokenA.symbol})
            </Text>
          </Text>
        </Trans>
      </RowItem>
    </TableHeader>
  )

  return (
    <ContentWrapper>
      <Tabs
        tabsCount={positions.length}
        selectedTab={pIndex}
        onChangedTab={index => setPositionIndex(index)}
        onAddTab={null}
        onRemoveTab={null}
        showChart={null}
        onToggleChart={null}
      />
      <BodyWrapper>
        {header}
        <PositionListItem
          position={positions[pIndex]}
          usdPrices={usdPrices}
          rotated={rotated}
          ticksAtLimit={{
            [Bound.LOWER]: ticksAtLimits[Bound.LOWER][pIndex],
            [Bound.UPPER]: ticksAtLimits[Bound.UPPER][pIndex],
          }}
        />
        {/* <MultipleLiquiditiesChart
          positionIndex={pIndex}
          ticksAtLimits={ticksAtLimits}
          rotated={rotated}
          // currencyA={tokenA ?? undefined}
          // currencyB={tokenB ?? undefined}
          // feeAmount={positions[pIndex].pool.fee}
          // ticksAtLimit={{
          //   [Bound.LOWER]: ticksAtLimits[Bound.LOWER][pIndex],
          //   [Bound.UPPER]: ticksAtLimits[Bound.UPPER][pIndex],
          // }}
          // price={price ? parseFloat((rotated ? positions[pIndex].invert() : price).toSignificant(8)) : undefined}
          // leftPrice={leftPrice}
          // rightPrice={rightPrice}
          // onLeftRangeInput={onLeftRangeInput}
          // onRightRangeInput={onRightRangeInput}
          // interactive
          // height="233.5px"
        /> */}
      </BodyWrapper>
    </ContentWrapper>
  )
}

export default ChartPositions
