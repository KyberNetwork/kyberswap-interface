import { RouteData } from '@0xsquid/sdk'
import { NativeCurrency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Repeat } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import Dots from 'components/Dots'
import { TokenLogoWithChain } from 'components/Logo'
import RefreshButton from 'components/SwapForm/RefreshButton'
import useTheme from 'hooks/useTheme'
import { getRouInfo } from 'pages/CrossChain/helpers'
import { useCrossChainState } from 'state/crossChain/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { MEDIA_WIDTHS } from 'theme'

import { StyledBalanceMaxMini } from '../../components/swapv2/styleds'

interface TradePriceProps {
  route: RouteData | undefined
  refresh?: () => void
  showLogo?: boolean
  disabled?: boolean
  loading?: boolean
}

export default function TradePrice({
  route,
  refresh,
  showLogo = true,
  disabled = false,
  loading = false,
}: TradePriceProps) {
  const theme = useTheme()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const { exchangeRate } = getRouInfo(route)
  let formattedPrice
  const price = exchangeRate ? Number(exchangeRate) : undefined
  if (price) formattedPrice = showInverted ? (1 / price).toPrecision(6) : price?.toPrecision(6)
  const [{ currencyIn, currencyOut, chainIdOut }] = useCrossChainState()

  const currencyLeft = showInverted ? currencyOut : currencyIn
  const currencyRight = showInverted ? currencyIn : currencyOut

  const renderSymbolOrLogo = (currency: NativeCurrency | WrappedTokenInfo) =>
    showLogo ? <TokenLogoWithChain size={14} currency={currency} /> : currency?.symbol

  const value = currencyLeft && currencyRight && chainIdOut && (
    <Flex alignItems={'center'} sx={{ gap: '4px' }} color={theme.text}>
      1 {renderSymbolOrLogo(currencyLeft)} = {formattedPrice} {renderSymbolOrLogo(currencyRight)}
    </Flex>
  )

  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  return (
    <Text
      fontWeight={500}
      fontSize={12}
      color={theme.subText}
      style={{ alignItems: 'center', display: 'flex', cursor: 'pointer' }}
      onClick={() => setShowInverted(!showInverted)}
      height="22px"
    >
      <Flex sx={{ gap: '4px' }} alignItems={'center'}>
        {refresh && (loading || formattedPrice) && (
          <RefreshButton shouldDisable={!route || disabled || loading} skipFirst callback={refresh} />
        )}
        {loading ? (
          <Dots>
            <Trans>Calculating</Trans>
          </Dots>
        ) : (
          formattedPrice && (
            <>
              {showLogo && !isMobile && <Trans>Cross-chain rate is</Trans>} {value}
              <StyledBalanceMaxMini>
                <Repeat size={12} />
              </StyledBalanceMaxMini>
            </>
          )
        )}
      </Flex>
    </Text>
  )
}
