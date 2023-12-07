import { Currency } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as DoubleArrow } from 'assets/svg/double_arrow.svg'
import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import CurrencyLogo from 'components/CurrencyLogo'
import { ClickableText } from 'components/YieldPools/styleds'
import useTheme from 'hooks/useTheme'
import { Bound } from 'state/mint/proamm/type'
import { MEDIA_WIDTHS } from 'theme'
import { formatTickPrice } from 'utils/formatTickPrice'
import { getTickToPrice } from 'utils/getTickToPrice'
import { formatDisplayNumber } from 'utils/numbers'

import PriceVisualizeAlignCurrent from './PriceVisualizeAlignCurrent'

const TableWrapper = styled.div`
  margin-top: 1rem;
`

const tableTemplateColumns = css`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 20px 1fr 2fr 2fr 4fr;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 20px 1fr 3fr;
  `};
`
const BodyWrapper = styled.div`
  max-height: calc(85vh - 300px);
  overflow-y: scroll;
`

const TableHeader = styled.div`
  ${tableTemplateColumns}
  padding: 16px 20px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  background-color: ${({ theme }) => theme.background};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  z-index: 1;
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};
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
  :last-child {
    border-bottom: none;
    border-bottom-right-radius: 20px;
    border-bottom-left-radius: 20px;
  }
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
  index,
  usdPrices,
  ticksAtLimit,
  rotated,
  baseCurrency,
  quoteCurrency,
}: {
  position: Position
  index: number
  usdPrices: {
    [address: string]: number
  }
  ticksAtLimit: {
    [bound in Bound]: boolean | undefined
  }
  rotated: boolean
  baseCurrency: Currency
  quoteCurrency: Currency
}) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const [isExpanded, setIsExpanded] = useState(false)
  const theme = useTheme()

  const [tokenAmountA, tokenAmountB, currencyA, currencyB, tokenA, tokenB] = rotated
    ? [
        position.amount1,
        position.amount0,
        quoteCurrency,
        baseCurrency,
        position.amount1.currency,
        position.amount0.currency,
      ]
    : [
        position.amount0,
        position.amount1,
        baseCurrency,
        quoteCurrency,
        position.amount0.currency,
        position.amount1.currency,
      ]

  const usdValue =
    parseFloat(position.amount0.toSignificant(6)) * usdPrices[position.amount0.currency.address] +
    parseFloat(position.amount1.toSignificant(6)) * usdPrices[position.amount1.currency.address]

  const priceLower = getTickToPrice(tokenA, tokenB, position.tickLower)
  const priceUpper = getTickToPrice(tokenA, tokenB, position.tickUpper)
  const formattedLowerPrice = formatTickPrice(priceLower, ticksAtLimit, Bound.LOWER)
  const formattedUpperPrice = formatTickPrice(priceUpper, ticksAtLimit, Bound.UPPER)

  if (!priceLower || !priceUpper) return null

  return (
    <TableRowWrapper>
      <TableRow>
        <RowItem>
          <Text>{index + 1}</Text>
        </RowItem>
        <RowItem>{formatDisplayNumber(usdValue, { style: 'currency', significantDigits: 4 })}</RowItem>

        {upToSmall ? null : (
          <>
            <RowItem>
              <Flex sx={{ gap: '4px' }} alignItems="center">
                <CurrencyLogo currency={currencyA} size="16px" />
                <Text>
                  {tokenAmountA.toSignificant(4)} {currencyA.symbol}
                </Text>
              </Flex>
            </RowItem>
            <RowItem>
              <Flex sx={{ gap: '4px' }} alignItems="center">
                <CurrencyLogo currency={currencyB} size="16px" />
                <Text>
                  {tokenAmountB.toSignificant(4)} {currencyB.symbol}
                </Text>
              </Flex>
            </RowItem>
          </>
        )}
        <Flex sx={{ gap: '8px' }} width="100%" alignItems="center">
          <PriceVisualizeAlignCurrent
            priceLower={priceLower}
            priceUpper={priceUpper}
            price={rotated ? position.pool.token1Price : position.pool.token0Price}
            ticksAtLimit={ticksAtLimit}
            center
          />
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
                <CurrencyLogo currency={currencyA} size="16px" />
                <Text>
                  {tokenAmountA.toSignificant(4)} {currencyA.symbol}
                </Text>
              </Flex>
            </Flex>
            <Flex sx={{ gap: '8px' }}>
              <Flex sx={{ gap: '4px' }} alignItems="center">
                <CurrencyLogo currency={currencyB} size="16px" />
                <Text>
                  {tokenAmountB.toSignificant(4)} {currencyB.symbol}
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

const ListPositions = ({
  positions,
  usdPrices,
  rotated,
  ticksAtLimits,
  baseCurrency,
  quoteCurrency,
}: {
  positions: Position[]
  usdPrices: {
    [address: string]: number
  }
  ticksAtLimits: {
    [bound in Bound]: (boolean | undefined)[]
  }
  rotated: boolean
  baseCurrency: Currency
  quoteCurrency: Currency
}) => {
  const [tokenA, tokenB] = rotated ? [quoteCurrency, baseCurrency] : [baseCurrency, quoteCurrency]
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const header = (
    <TableHeader>
      <RowItem alignItems="flex-start">
        <Text>#</Text>
      </RowItem>
      <RowItem alignItems="flex-start">
        <Trans>VALUE</Trans>
      </RowItem>

      {upToSmall ? null : (
        <>
          <RowItem alignItems="flex-start">{tokenA.symbol}</RowItem>
          <RowItem alignItems="flex-start">{tokenB.symbol}</RowItem>
        </>
      )}

      <RowItem alignItems="flex-end">
        <Text>
          <Trans>
            PRICE RANGE{' '}
            <Text as="span" sx={{ whiteSpace: 'nowrap' }}>
              ({quoteCurrency.symbol} per {baseCurrency.symbol})
            </Text>
          </Trans>
        </Text>
      </RowItem>
    </TableHeader>
  )

  const body = positions.map((position, index) => {
    return (
      <PositionListItem
        key={index}
        position={position}
        index={index}
        usdPrices={usdPrices}
        rotated={rotated}
        ticksAtLimit={{
          [Bound.LOWER]: ticksAtLimits[Bound.LOWER][index],
          [Bound.UPPER]: ticksAtLimits[Bound.UPPER][index],
        }}
        baseCurrency={baseCurrency}
        quoteCurrency={quoteCurrency}
      />
    )
  })
  return (
    <TableWrapper>
      {header}
      <BodyWrapper>{body}</BodyWrapper>
    </TableWrapper>
  )
}

export default ListPositions
