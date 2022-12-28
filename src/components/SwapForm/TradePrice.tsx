import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import React, { useState } from 'react'
import { Repeat } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

export const IconButton = styled.button`
  width: 22px;
  height: 22px;

  display: flex;
  justify-content: center;
  align-items: center;

  cursor: pointer;
  background-color: transparent;
  outline: none;
  border: none;
  padding: 0.2rem;
  font-size: 0.875rem;
  font-weight: 400;
  border-radius: 999px;
  color: ${({ theme }) => theme.text2};
  transition: background 200ms;

  :hover {
    background-color: ${({ theme }) => theme.bg3};
    outline: none;
  }
`

const toPrice = (
  inputAmount: CurrencyAmount<Currency>,
  outputAmount: CurrencyAmount<Currency>,
): Price<Currency, Currency> => {
  return new Price(inputAmount.currency, outputAmount.currency, inputAmount.quotient, outputAmount.quotient)
}

type Props = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  parsedAmountIn: CurrencyAmount<Currency> | undefined
  parsedAmountOut: CurrencyAmount<Currency> | undefined
}
const TradePrice: React.FC<Props> = ({ currencyIn, currencyOut, parsedAmountIn, parsedAmountOut }) => {
  const theme = useTheme()
  const [inverted, setInverted] = useState(false)

  const price = parsedAmountIn && parsedAmountOut ? toPrice(parsedAmountIn, parsedAmountOut) : undefined

  const label = inverted
    ? `${currencyOut?.symbol} = 1 ${currencyIn?.symbol}`
    : `${currencyIn?.symbol} = 1 ${currencyOut?.symbol}`

  const getFormattedPrice = () => {
    try {
      return inverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)
    } catch (error) {
      return ''
    }
  }
  const formattedPrice = getFormattedPrice()
  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)

  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer',
      }}
      fontWeight={500}
      fontSize={12}
      height="22px"
      color={theme.subText}
      onClick={() => setInverted(!inverted)}
    >
      {show && formattedPrice ? (
        <>
          <Flex sx={{ alignItems: 'center' }}>
            {formattedPrice} {label}
          </Flex>

          <IconButton onClick={() => setInverted(i => !i)}>
            <Repeat size={12} />
          </IconButton>
        </>
      ) : (
        '-'
      )}
    </Flex>
  )
}

export default TradePrice
