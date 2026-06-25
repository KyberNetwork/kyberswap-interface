import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'

import { HiddenH1, HiddenH2 } from 'components/Seo/HiddenSeoHeadings'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { TAB } from 'pages/SwapV3'
import HeaderRightMenu from 'pages/SwapV3/HeaderRightMenu'
import Tabs from 'pages/SwapV3/Tabs'
import { useDegenModeManager } from 'state/user/hooks'
import { CloseIcon } from 'theme'

export default function Header({
  activeTab,
  setActiveTab,
  customChainId,
  activeMainTab,
}: {
  activeTab: TAB
  setActiveTab: (tab: TAB) => void
  customChainId?: ChainId
  activeMainTab?: TAB
}) {
  const [isDegenMode] = useDegenModeManager()
  const [isShowDegenBanner, setShowDegenBanner] = useState(true)
  const { pathname } = useLocation()

  const selectedTab = activeMainTab || activeTab
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT) || selectedTab === TAB.LIMIT
  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP) || selectedTab == TAB.SWAP
  const isCrossChainPage = pathname.startsWith(APP_PATHS.CROSS_CHAIN) || selectedTab === TAB.CROSS_CHAIN

  return (
    <>
      <Stack className="w-full items-center gap-2">
        <HStack className="min-h-9 w-full items-center justify-between gap-3">
          <Tabs activeTab={selectedTab} setActiveTab={setActiveTab} customChainId={customChainId} />
          <HeaderRightMenu activeTab={activeTab} setActiveTab={setActiveTab} activeMainTab={activeMainTab} />
        </HStack>
        <HStack className="w-full items-center justify-between gap-3">
          {isLimitPage && (
            <>
              <HiddenH1>Auto execute with your price target.</HiddenH1>
              <HiddenH2>
                Gasless & no slippage - Kyberswap Limit Order execute on-chain automatically when the market reaches
                your price.
              </HiddenH2>
              <span className="text-xs text-subText">{t`Buy or sell tokens at customized prices`}</span>
            </>
          )}
          {isSwapPage && (
            <>
              <HiddenH1>Swap any token at the best rate across chains.</HiddenH1>
              <HiddenH2>
                An advanced aggregator splits your trade across hundreds of DEXs and liquidity sources for minimal
                slippage.
              </HiddenH2>
              <span className="text-xs text-subText">{t`Instantly buy or sell tokens at superior prices`}</span>
            </>
          )}
          {isCrossChainPage && (
            <>
              <HiddenH1>
                Swap tokens between EVMs, Bitcoin, Solana, and Near chains in one step - no manual bridging.
              </HiddenH1>
              <HiddenH2>Quotes from multiple providers, best rate picked automatically.</HiddenH2>
              <span className="text-xs text-subText">{t`Swap between tokens on different chains`}</span>
            </>
          )}
        </HStack>
      </Stack>
      {isDegenMode && isShowDegenBanner && (
        <HStack className="items-center justify-between gap-3 rounded-3xl bg-warning-30 px-4 py-2.5">
          <span className="text-xs font-normal text-text">
            <Trans>You have turned on Degen Mode. Be cautious</Trans>
          </span>
          <CloseIcon size={14} onClick={() => setShowDegenBanner(false)} />
        </HStack>
      )}
    </>
  )
}
