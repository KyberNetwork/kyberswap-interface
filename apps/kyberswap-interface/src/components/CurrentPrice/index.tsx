import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'

import { ButtonEmpty } from 'components/Button'
import SwitchIcon from 'components/Icons/SwitchIcon'
import useTheme from 'hooks/useTheme'
import { useCurrencyConvertedToNative } from 'utils/dmm'

interface CurrentPriceProps {
  price?: Price<Currency, Currency>
}

export default function CurrentPrice({ price }: CurrentPriceProps) {
  const theme = useTheme()
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const formattedPrice = showInverted ? price?.toSignificant(8) : price?.invert()?.toSignificant(8)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  const nativeQuote = useCurrencyConvertedToNative(price?.quoteCurrency as Currency)
  const nativeBase = useCurrencyConvertedToNative(price?.baseCurrency as Currency)
  const label = showInverted
    ? `1 ${nativeBase?.symbol} = ${formattedPrice ?? '-'} ${nativeQuote?.symbol}`
    : `1 ${nativeQuote?.symbol} = ${formattedPrice ?? '-'} ${nativeBase?.symbol}`

  return (
    <span className="text-sm font-normal">
      {show ? (
        <span className="flex items-center">
          <span className="mr-1">{label}</span>
          <ButtonEmpty padding="0" width="fit-content" onClick={() => setShowInverted(!showInverted)}>
            <SwitchIcon color={theme.text} />
          </ButtonEmpty>
        </span>
      ) : (
        '-'
      )}
    </span>
  )
}
