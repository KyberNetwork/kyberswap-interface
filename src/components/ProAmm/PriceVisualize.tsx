import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { useCallback, useState } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import Tooltip from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { Bound } from 'state/mint/proamm/type'
import { formatTickPrice } from 'utils/formatTickPrice'

export const Dot = styled.div<{ isCurrentPrice?: boolean; outOfRange?: boolean }>`
  width: 8px;
  min-width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, outOfRange, isCurrentPrice }) =>
    isCurrentPrice ? theme.text : outOfRange ? theme.warning : theme.primary};
`

const PriceVisualizeWrapper = styled.div`
  margin-top: 12px;
  height: 2px;
  background: ${({ theme }) => theme.border};
  align-items: center;
  display: flex;
  width: 100%;
`

const PriceVisualize = ({
  priceLower: priceLowerProp,
  priceUpper: priceUpperProp,
  price,
  showTooltip,
  ticksAtLimit,
}: {
  priceLower: Price<Currency, Currency>
  priceUpper: Price<Currency, Currency>
  price: Price<Currency, Currency>
  showTooltip?: boolean
  ticksAtLimit?: {
    [bound in Bound]: boolean | undefined
  }
}) => {
  const theme = useTheme()
  const reverted = !priceLowerProp.baseCurrency.wrapped.sortsBefore(priceLowerProp.quoteCurrency.wrapped)

  const [priceLower, priceUpper] = reverted ? [priceUpperProp, priceLowerProp] : [priceLowerProp, priceUpperProp]
  const outOfRange = price.lessThan(priceLower) || price.greaterThan(priceUpper)

  const minPrice = priceLower.lessThan(price) ? priceLower : price
  const maxPrice = priceUpper.greaterThan(price) ? priceUpper : price
  const middlePrice = priceLower.lessThan(price) ? (priceUpper.greaterThan(price) ? price : priceUpper) : priceLower

  const delta = maxPrice.equalTo(minPrice)
    ? '1'
    : middlePrice.subtract(minPrice).divide(maxPrice.subtract(minPrice)).toSignificant(6)

  const formattedMinPrice = formatTickPrice(minPrice, ticksAtLimit, Bound.LOWER)
  const formattedMaxPrice = formatTickPrice(maxPrice, ticksAtLimit, Bound.UPPER)
  const formattedMiddlePrice = formatTickPrice(middlePrice)

  const [show, setShow] = useState(false)

  const onFocus = useCallback(() => {
    console.log('show')
    setShow(true)
  }, [])

  const onLeave = useCallback(() => {
    console.log('leave')
    setShow(false)
  }, [])

  console.log('render show =', show)
  return (
    <PriceVisualizeWrapper onMouseEnter={onFocus} onMouseLeave={onLeave}>
      <Flex width="20%" />
      <Dot isCurrentPrice={minPrice.equalTo(price)} outOfRange={outOfRange}>
        {showTooltip && (
          <Tooltip
            text={formattedMinPrice}
            containerStyle={{ width: '100%' }}
            style={{ minWidth: '50px' }}
            width="fit-content"
            show={show}
            placement="left"
            offset={[0, 8]}
          />
        )}
      </Dot>
      <Flex
        height="2px"
        width={(+delta * 60).toString() + '%'}
        backgroundColor={
          middlePrice.equalTo(priceUpper) ? theme.warning : middlePrice.equalTo(price) ? theme.primary : theme.border
        }
      />
      <Dot isCurrentPrice={middlePrice.equalTo(price)} outOfRange={outOfRange}>
        {showTooltip && (
          <Tooltip
            text={formattedMiddlePrice}
            containerStyle={{ width: '100%' }}
            style={{ minWidth: '70px' }}
            width="fit-content"
            show={show}
            placement="top"
            offset={[8, 30]}
          />
        )}
      </Dot>

      <Flex
        height="2px"
        flex={1}
        backgroundColor={
          middlePrice.equalTo(priceLower) ? theme.warning : middlePrice.equalTo(price) ? theme.primary : theme.border
        }
      />
      <Dot isCurrentPrice={maxPrice.equalTo(price)} outOfRange={outOfRange}>
        {showTooltip && (
          <Tooltip
            text={formattedMaxPrice}
            containerStyle={{ width: '100%' }}
            style={{ minWidth: '50px' }}
            width="fit-content"
            show={show}
            placement="right"
            offset={[0, 8]}
          />
        )}
      </Dot>

      <Flex width="20%" />
    </PriceVisualizeWrapper>
  )
}

export default PriceVisualize
