import { Currency, Price } from '@kyberswap/ks-sdk-core'
import React, { CSSProperties, useState } from 'react'
import { Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import { useCurrencyConvertedToNative } from 'utils/dmm'

export const IconButton = styled.button`
  width: 22px;
  height: 22px;

  display: flex;
  justify-content: center;
  align-items: center;

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
  }
  :focus {
    background-color: ${({ theme }) => theme.bg3};
    outline: none;
  }
`

type Props = {
  price?: Price<Currency, Currency>
  style?: CSSProperties
}

const TradePrice: React.FC<Props> = ({ price, style = {} }) => {
  const theme = useTheme()
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  const nativeQuote = useCurrencyConvertedToNative(price?.quoteCurrency)
  const nativeBase = useCurrencyConvertedToNative(price?.baseCurrency)
  const label = showInverted
    ? `${nativeQuote?.symbol} = 1 ${nativeBase?.symbol}`
    : `${nativeBase?.symbol} = 1 ${nativeQuote?.symbol}`

  const getFormattedPrice = () => {
    try {
      return showInverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)
    } catch (error) {
      return ''
    }
  }

  const formattedPrice = getFormattedPrice()

  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <Text
        fontWeight={500}
        fontSize={12}
        color={theme.subText}
        sx={{ alignItems: 'center', display: 'flex', cursor: 'pointer', ...style }}
        onClick={() => setShowInverted(!showInverted)}
        height="22px"
      >
        {show && formattedPrice ? `${formattedPrice} ${label}` : '-'}
      </Text>

      {show && formattedPrice && (
        <IconButton>
          <Repeat size={12} />
        </IconButton>
      )}
    </Flex>
  )
}

export default TradePrice
