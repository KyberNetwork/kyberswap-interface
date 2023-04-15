import { RouteData } from '@0xsquid/sdk'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'

import { TokenLogoWithChain } from 'components/Logo'
import RefreshButton from 'components/SwapForm/RefreshButton'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { getRouInfo } from 'pages/CrossChain/helpers'
import { useCrossChainState } from 'state/bridge/hooks'

import { StyledBalanceMaxMini } from '../../components/swapv2/styleds'

interface TradePriceProps {
  route: RouteData | undefined
  refresh: () => void
}

export default function TradePrice({ route, refresh }: TradePriceProps) {
  const theme = useTheme()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const { exchangeRate } = getRouInfo(route)
  let formattedPrice
  const price = exchangeRate ? Number(exchangeRate) : undefined
  if (price) formattedPrice = showInverted ? (1 / price).toPrecision(6) : price?.toPrecision(6)
  // todo check spam api
  const [{ currencyIn, currencyOut, chainIdOut }] = useCrossChainState()
  const { chainId } = useActiveWeb3React()
  const tokenInLogo = currencyIn?.logoURI
  const tokenOutLogo = currencyOut?.logoURI

  const value = tokenOutLogo && tokenInLogo && chainId && chainIdOut && (
    <Flex alignItems={'center'} sx={{ gap: '4px' }} color={theme.text}>
      1{' '}
      <TokenLogoWithChain
        size={14}
        chainId={showInverted ? chainIdOut : chainId}
        tokenLogo={showInverted ? tokenOutLogo : tokenInLogo}
      />
      = {formattedPrice}{' '}
      <TokenLogoWithChain
        size={14}
        tokenLogo={showInverted ? tokenInLogo : tokenOutLogo}
        chainId={showInverted ? chainId : chainIdOut}
      />
    </Flex>
  )

  return (
    <Text
      fontWeight={500}
      fontSize={12}
      color={theme.subText}
      style={{ alignItems: 'center', display: 'flex', cursor: 'pointer' }}
      onClick={() => setShowInverted(!showInverted)}
      height="22px"
    >
      {formattedPrice ? (
        <Flex sx={{ gap: '4px' }} alignItems={'center'}>
          <RefreshButton shouldDisable={!route} callback={refresh} />
          <Trans>Cross-chain rate is</Trans> {value}
          <StyledBalanceMaxMini>
            <Repeat size={12} />
          </StyledBalanceMaxMini>
        </Flex>
      ) : (
        <div />
      )}
    </Text>
  )
}
