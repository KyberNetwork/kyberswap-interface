import { Currency } from '@kyberswap/ks-sdk-core'
import { CSSProperties } from 'react'

import CurrencyLogo from 'components/CurrencyLogo'
import Logo from 'components/Logo'

interface DoubleCurrencyLogoProps {
  margin?: boolean
  size?: number
  currency0?: Currency | null
  currency1?: Currency | null
}

const wrapperStyle = (sizeraw: number, margin: boolean): CSSProperties => ({
  marginRight: margin ? `${(3 * sizeraw) / 4 + 8}px` : undefined,
})

const coveredStyle = (sizeraw: number): CSSProperties => ({
  left: `${(3 * sizeraw) / 4}px`,
})

export default function DoubleCurrencyLogo({
  currency0,
  currency1,
  size = 16,
  margin = true,
}: DoubleCurrencyLogoProps) {
  return (
    <div className="relative flex flex-row items-center" style={wrapperStyle(size, margin)}>
      {currency0 && (
        <div className="z-[2] flex items-center">
          <CurrencyLogo currency={currency0} size={size.toString() + 'px'} />
        </div>
      )}
      {currency1 && (
        <div className="absolute z-[1] flex items-center" style={coveredStyle(size)}>
          <CurrencyLogo currency={currency1} size={size.toString() + 'px'} />
        </div>
      )}
    </div>
  )
}

export function DoubleCurrencyLogoV2({
  logoUrl1,
  logoUrl2,
  size = 16,
  style = {},
}: {
  logoUrl1: string
  logoUrl2: string
  size: number
  style?: CSSProperties
}) {
  return (
    <div className="relative flex flex-row items-center" style={{ ...wrapperStyle(size, false), ...style }}>
      {logoUrl1 && (
        <div className="z-[2] flex items-center">
          <Logo srcs={[logoUrl1]} style={{ width: size, height: size, borderRadius: '100%' }} />
        </div>
      )}
      {logoUrl2 && (
        <div className="absolute z-[1] flex items-center" style={coveredStyle(size)}>
          <Logo srcs={[logoUrl2]} style={{ width: size, height: size, borderRadius: '100%' }} />
        </div>
      )}
    </div>
  )
}
