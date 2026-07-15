import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { CSSProperties, ReactNode, useState } from 'react'
import { Repeat } from 'react-feather'

import IconButton from 'components/Button/IconButton'
import Dots from 'components/Dots'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { formatDisplayNumber } from 'utils/numbers'

interface TradePriceProps {
  price: Price<Currency, Currency> | undefined
  label?: ReactNode
  icon?: ReactNode
  style?: CSSProperties
  color?: string
  className?: string
}

const TradePrice = ({ price, label, icon, style = {}, color, className }: TradePriceProps) => {
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
      className={cn(
        'group flex items-center text-xs font-medium text-subText',
        show ? 'cursor-pointer hover:brightness-[0.85]' : 'cursor-default',
        className,
      )}
      style={color ? { color, ...style } : style}
      onClick={() => show && setShowInverted(!showInverted)}
    >
      {show ? (
        <>
          {label && <>{label}&nbsp;</>} <span>{value}</span>
          <IconButton variant="compact" className="group-hover:brightness-[0.85]">
            {icon || <Repeat size={12} />}
          </IconButton>
        </>
      ) : (
        <Dots>
          <Trans>Calculating</Trans>
        </Dots>
      )}
    </span>
  )
}

export default TradePrice
