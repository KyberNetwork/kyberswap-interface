import { Currency } from '@kyberswap/ks-sdk-core'
import { Box } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import Logo from 'components/Logo'
import { RowFit } from 'components/Row'

const Wrapper = styled.div<{ margin: boolean; sizeraw: number }>`
  position: relative;
  display: flex;
  align-items: center;
  flex-direction: row;
  margin-right: ${({ sizeraw, margin }) => margin && ((3 * sizeraw) / 4 + 8).toString() + 'px'};
`

interface DoubleCurrencyLogoProps {
  margin?: boolean
  size?: number
  currency0?: Currency | null
  currency1?: Currency | null
}

const HigherLogo = styled.div`
  z-index: 2;
  display: flex;
  align-items: center;
`
const CoveredLogo = styled.div<{ sizeraw: number }>`
  z-index: 1;
  position: absolute;
  display: flex;
  align-items: center;
  left: ${({ sizeraw }) => ((3 * sizeraw) / 4).toString() + 'px'} !important;
`

export default function DoubleCurrencyLogo({
  currency0,
  currency1,
  size = 16,
  margin = true,
}: DoubleCurrencyLogoProps) {
  return (
    <Wrapper sizeraw={size} margin={margin}>
      {currency0 && (
        <HigherLogo>
          <CurrencyLogo currency={currency0} size={size.toString() + 'px'} />
        </HigherLogo>
      )}
      {currency1 && (
        <CoveredLogo sizeraw={size}>
          <CurrencyLogo currency={currency1} size={size.toString() + 'px'} />
        </CoveredLogo>
      )}
    </Wrapper>
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
    <Wrapper sizeraw={size} margin={false} style={style}>
      {logoUrl1 && (
        <HigherLogo>
          <Logo srcs={[logoUrl1]} style={{ width: size, height: size, borderRadius: '100%' }} />
        </HigherLogo>
      )}
      {logoUrl2 && (
        <CoveredLogo sizeraw={size}>
          <Logo srcs={[logoUrl2]} style={{ width: size, height: size, borderRadius: '100%' }} />
        </CoveredLogo>
      )}
    </Wrapper>
  )
}

export function DoubleLogoWithChain({
  logoUrl1,
  logoUrl2,
  chainUrl,
  size = 36,
  chainSize = 18,
}: {
  logoUrl1: string
  logoUrl2: string
  chainUrl: string
  size?: number
  chainSize?: number
}) {
  return (
    <RowFit align="flex-end">
      {logoUrl1 && (
        <Box style={{ zIndex: 1 }}>
          <Logo srcs={[logoUrl1]} style={{ width: size, height: size, borderRadius: '100%' }} />
        </Box>
      )}
      {logoUrl2 && (
        <Box style={{ zIndex: 2, marginLeft: -size / 4 + 'px' }}>
          <Logo srcs={[logoUrl2]} style={{ width: size, height: size, borderRadius: '100%' }} />
        </Box>
      )}
      {chainUrl && (
        <Box style={{ zIndex: 3, marginLeft: -chainSize / 3 + 'px' }}>
          <Logo srcs={[chainUrl]} style={{ width: chainSize, height: chainSize, borderRadius: '100%' }} />
        </Box>
      )}
    </RowFit>
  )
}
