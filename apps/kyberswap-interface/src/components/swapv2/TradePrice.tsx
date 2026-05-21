import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { CSSProperties, ReactNode, useState } from 'react'
import { Repeat } from 'react-feather'

import useTheme from 'hooks/useTheme'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { formatDisplayNumber } from 'utils/numbers'

import { Dots, StyledBalanceMaxMini } from './styleds'

interface TradePriceProps {
  price: Price<Currency, Currency> | undefined
  label?: ReactNode
  icon?: ReactNode
  style?: CSSProperties
  color?: string
}

export default function TradePrice({ price, label, icon, style = {}, color }: TradePriceProps) {
  const theme = useTheme()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  let formattedPrice
  try {
    formattedPrice = formatDisplayNumber(showInverted ? price?.invert() : price, { fractionDigits: 4 })
  } catch (error) {}

  const MAX_PRICE_LENGTH = 18
  const displayPrice =
    typeof formattedPrice === 'string' && formattedPrice.length > MAX_PRICE_LENGTH
      ? `${formattedPrice.slice(0, MAX_PRICE_LENGTH)}…`
      : formattedPrice

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency && formattedPrice)
  const nativeQuote = useCurrencyConvertedToNative(price?.quoteCurrency)
  const nativeBase = useCurrencyConvertedToNative(price?.baseCurrency)
  const value = showInverted
    ? `1 ${nativeQuote?.symbol} = ${displayPrice} ${nativeBase?.symbol}`
    : `1 ${nativeBase?.symbol} = ${displayPrice} ${nativeQuote?.symbol}`

  return (
    <span
      className="flex h-[22px] cursor-pointer items-center text-xs font-medium"
      style={{ color: color || theme.subText, ...style }}
      onClick={() => setShowInverted(!showInverted)}
    >
      {show ? (
        <>
          {label && <>{label}&nbsp;</>} <span style={{ color }}>{value}</span>
          <StyledBalanceMaxMini>{icon || <Repeat size={12} color={color} />}</StyledBalanceMaxMini>
        </>
      ) : (
        <Dots>
          <Trans>Calculating</Trans>
        </Dots>
      )}
    </span>
  )
}
