import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ColumnCenter } from 'components/Column'
import { RowBetween } from 'components/Row'
import { HiddenH1, HiddenH2 } from 'components/Seo/HiddenSeoHeadings'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { TAB } from 'pages/SwapV3'
import HeaderRightMenu from 'pages/SwapV3/HeaderRightMenu'
import Tabs from 'pages/SwapV3/Tabs'
import { useDegenModeManager } from 'state/user/hooks'
import { CloseIcon } from 'theme'

const DegenBanner = styled(RowBetween)`
  padding: 10px 16px;
  background-color: ${({ theme }) => rgba(theme.warning, 0.3)};
  border-radius: 24px;
`

export default function Header({
  activeTab,
  setActiveTab,
  customChainId,
}: {
  activeTab: TAB
  setActiveTab: (tab: TAB) => void
  customChainId?: ChainId
}) {
  const theme = useTheme()
  const [isDegenMode] = useDegenModeManager()
  const [isShowDegenBanner, setShowDegenBanner] = useState(true)
  const { pathname } = useLocation()

  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT) || activeTab === TAB.LIMIT
  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP) || activeTab == TAB.SWAP
  const isCrossChainPage = pathname.startsWith(APP_PATHS.CROSS_CHAIN) || activeTab === TAB.CROSS_CHAIN

  return (
    <>
      <ColumnCenter gap="sm">
        <RowBetween minHeight={36}>
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} customChainId={customChainId} />
          <HeaderRightMenu activeTab={activeTab} setActiveTab={setActiveTab} />
        </RowBetween>
        <RowBetween>
          {isLimitPage && (
            <>
              <HiddenH1>Auto execute with your price target.</HiddenH1>
              <HiddenH2>
                Gasless & no slippage - Kyberswap Limit Order execute on-chain automatically when the market reaches
                your price.
              </HiddenH2>
              <Text fontSize={12} color={theme.subText}>
                {t`Buy or sell tokens at customized prices`}
              </Text>
            </>
          )}
          {isSwapPage && (
            <>
              <HiddenH1>Swap any token at the best rate across chains.</HiddenH1>
              <HiddenH2>
                An advanced aggregator splits your trade across hundreds of DEXs and liquidity sources for minimal
                slippage.
              </HiddenH2>
              <Text fontSize={12} color={theme.subText}>
                {t`Instantly buy or sell tokens at superior prices`}
              </Text>
            </>
          )}
          {isCrossChainPage && (
            <>
              <HiddenH1>
                Swap tokens between EVMs, Bitcoin, Solana, and Near chains in one step - no manual bridging.
              </HiddenH1>
              <HiddenH2>Quotes from multiple providers, best rate picked automatically.</HiddenH2>
              <Text fontSize={12} color={theme.subText}>
                {t`Swap between tokens on different chains`}
              </Text>
            </>
          )}
        </RowBetween>
      </ColumnCenter>
      {isDegenMode && isShowDegenBanner && (
        <DegenBanner>
          <Text fontSize={12} fontWeight={400} color={theme.text}>
            <Trans>You have turned on Degen Mode. Be cautious</Trans>
          </Text>
          <CloseIcon size={14} onClick={() => setShowDegenBanner(false)} />
        </DegenBanner>
      )}
    </>
  )
}
