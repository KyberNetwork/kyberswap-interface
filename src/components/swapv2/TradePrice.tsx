import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { CSSProperties, useState } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'

import { BaseTradeInfo } from 'components/swapv2/LimitOrder/useBaseTradeInfo'
import useTheme from 'hooks/useTheme'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { toFixed } from 'utils/numbers'

import { StyledBalanceMaxMini } from './styleds'

interface TradePriceProps {
  price?: Price<Currency, Currency>
  style?: CSSProperties
  label?: string
  color?: string
}

export default function TradePrice({ price, style = {}, label, color }: TradePriceProps) {
  const theme = useTheme()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  let formattedPrice
  try {
    formattedPrice = showInverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)
  } catch (error) {}

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency && formattedPrice)
  const nativeQuote = useCurrencyConvertedToNative(price?.quoteCurrency)
  const nativeBase = useCurrencyConvertedToNative(price?.baseCurrency)
  const value = showInverted
    ? `${nativeQuote?.symbol} = 1 ${nativeBase?.symbol}`
    : `${nativeBase?.symbol} = 1 ${nativeQuote?.symbol}`

  return (
    <Text
      fontWeight={500}
      fontSize={12}
      color={theme.subText}
      style={{ alignItems: 'center', display: 'flex', cursor: 'pointer', ...style }}
      onClick={() => setShowInverted(!showInverted)}
      height="22px"
    >
      {show ? (
        <>
          {label && <>{label}&nbsp;</>}
          <Text color={color}>
            {formattedPrice} {value}
          </Text>
          <StyledBalanceMaxMini>
            <Repeat size={12} />
          </StyledBalanceMaxMini>
        </>
      ) : (
        '-'
      )}
    </Text>
  )
}

interface TradePricePropsV2 {
  price?: BaseTradeInfo
  style?: CSSProperties
  label?: string
  color?: string
  symbolIn: string | undefined
  symbolOut: string | undefined
  loading: boolean
}
export function TradePriceV2({ price, style = {}, label, color, symbolIn, symbolOut, loading }: TradePricePropsV2) {
  const theme = useTheme()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  let formattedPrice
  try {
    if (price) {
      formattedPrice = showInverted
        ? toFixed(parseFloat(price?.invertRate.toPrecision(6)))
        : toFixed(parseFloat(price?.marketRate.toPrecision(6)))
    }
  } catch (error) {}

  const show = Boolean(price?.marketRate && price?.invertRate && formattedPrice)
  const value = showInverted ? `${symbolIn} = 1 ${symbolOut}` : `${symbolOut} = 1 ${symbolIn}`

  return (
    <Text
      fontWeight={500}
      fontSize={12}
      color={theme.subText}
      style={{ alignItems: 'center', display: 'flex', cursor: 'pointer', ...style }}
      onClick={() => setShowInverted(!showInverted)}
      height="22px"
    >
      {loading ? null : show ? (
        <>
          {label && <>{label}&nbsp;</>}
          <Text color={color}>
            {formattedPrice} {value}
          </Text>
          <StyledBalanceMaxMini>
            <Repeat size={12} />
          </StyledBalanceMaxMini>
        </>
      ) : (
        <Text>
          <Trans>Unable to get the market price</Trans>
        </Text>
      )}
    </Text>
  )
}
