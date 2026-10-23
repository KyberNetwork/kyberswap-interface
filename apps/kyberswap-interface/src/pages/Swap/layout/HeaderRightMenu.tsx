import { t } from '@lingui/macro'
import { type ReactNode } from 'react'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'

import IconButton from 'components/Button/IconButton'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import NotificationTester from 'components/LimitOrder/NotificationTester'
import { MouseoverTooltip } from 'components/Tooltip'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { TAB } from 'pages/Swap/Layout/Tabs'
import { useCurrenciesByPage } from 'pages/Swap/hooks/useCurrenciesByPage'
import { useDegenModeManager, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isSwapLikePath } from 'utils/routes'
import { formatSlippage } from 'utils/slippage'

type TokenInfoButtonProps = {
  onClick?: () => void
  size?: number
  active?: boolean
}

export const TokenInfoButton = ({ onClick, size, active }: TokenInfoButtonProps) => (
  <IconButton variant="action" active={active} aria-label={t`Token Info`} aria-pressed={active} onClick={onClick}>
    <MouseoverTooltip text={t`Token Info`} placement="top" width="fit-content" disableTooltip={isMobile}>
      <Info className="text-subText" size={size || 20} />
    </MouseoverTooltip>
  </IconButton>
)

/** Owns header tab actions; History is supplied by the page.
 * Unified mixed-chain pairs expose Token Info when either side is EVM; legacy cross-chain stays excluded. */
type HeaderRightMenuProps = {
  activeTab: TAB
  setActiveTab: (tab: TAB) => void
  historyButton?: ReactNode
  isCrossChainMode?: boolean
  activeMainTab?: TAB
}

export const HeaderRightMenu = ({
  activeTab,
  setActiveTab,
  activeMainTab,
  isCrossChainMode,
  historyButton,
}: HeaderRightMenuProps) => {
  const { pathname } = useLocation()
  const { currencies, inputChain, outputChain } = useCurrenciesByPage()
  const { trackingHandler } = useTracking(currencies)

  const [isDegenMode] = useDegenModeManager()
  const [slippage] = useUserSlippageTolerance()
  const [transactionTimeout] = useUserTransactionTTL()
  const { networkInfo } = useActiveWeb3React()
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)

  const isLimitOrderRoute = pathname.startsWith(APP_PATHS.LIMIT)
  const isLimitPage = isLimitOrderRoute || activeMainTab === TAB.LIMIT
  // Stop market order sits under the Limit Order tab but has display settings of its own.
  const isStopMarketPage = pathname.startsWith(APP_PATHS.STOP_MARKET)
  const isSwapPage = isSwapLikePath(pathname) || activeMainTab === TAB.SWAP
  const isCrossChainPage = isCrossChainMode || pathname.startsWith(APP_PATHS.CROSS_CHAIN) || activeMainTab === TAB.CROSS_CHAIN
  const defaultTab =
    activeMainTab || (isSwapPage ? TAB.SWAP : isLimitPage ? TAB.LIMIT : isCrossChainPage ? TAB.CROSS_CHAIN : TAB.SWAP)

  const supportsTokenInfo =
    !isCrossChainPage || (isSwapPage && (typeof inputChain === 'number' || typeof outputChain === 'number'))

  const onToggleActionTab = (tab: TAB) => {
    setActiveTab(activeTab === tab ? defaultTab : tab)
  }

  const handleTokenInfoClick = () => {
    trackingHandler(TRACKING_EVENT_TYPE.SWAP_TOKEN_INFO_CLICK)
    onToggleActionTab(TAB.INFO)
  }

  const handleSettingsClick = () => {
    onToggleActionTab(TAB.SETTINGS)

    if (isLimitPage || isStopMarketPage) return

    if (isCrossChainPage) {
      trackingHandler(TRACKING_EVENT_TYPE.CC_SETTINGS_OPENED, {
        current_max_slippage: formatSlippage(slippage, false),
      })
      return
    }

    trackingHandler(TRACKING_EVENT_TYPE.SWAP_SETTINGS_CLICK, {
      current_max_slippage: formatSlippage(slippage, false),
      current_transaction_time_limit: transactionTimeout / 60,
      current_gas_token: networkInfo.nativeToken.symbol,
    })
  }

  return (
    <div className="flex items-center gap-1">
      {supportsTokenInfo && (
        <TokenInfoButton
          active={activeTab === TAB.INFO}
          size={upToXXSmall ? 16 : 20}
          onClick={() => {
            trackingHandler(TRACKING_EVENT_TYPE.SWAP_TOKEN_INFO_CLICK)
            onToggleActionTab(TAB.INFO)
          }}
        />
      )}
      {historyButton}
      {(!isLimitPage || isLimitOrderRoute || isStopMarketPage) && (
        <IconButton
          variant="action"
          active={activeTab === TAB.SETTINGS}
          onClick={handleSettingsClick}
          aria-label="Swap Settings"
        >
          <MouseoverTooltip
            text={isDegenMode ? t`Degen mode is on. Be cautious!` : t`Settings`}
            placement="top"
            width="fit-content"
            disableTooltip={isMobile}
          >
            <span id={TutorialIds.BUTTON_SETTING_SWAP_FORM} className="leading-none">
              <TransactionSettingsIcon className={isDegenMode ? 'text-warning' : 'text-subText'} />
            </span>
          </MouseoverTooltip>
        </IconButton>
      )}

      <NotificationTester visible={false} />
    </div>
  )
}
