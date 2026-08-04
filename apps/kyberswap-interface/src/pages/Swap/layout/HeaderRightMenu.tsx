import { t } from '@lingui/macro'
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
import { useCurrenciesByPage } from 'pages/Swap/hooks/useCurrenciesByPage'
import { TAB } from 'pages/Swap/layout/Tabs'
import { useDegenModeManager, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isSwapLikePath } from 'utils/routes'
import { formatSlippage } from 'utils/slippage'

type TokenInfoButtonProps = {
  onClick?: () => void
  size?: number
}

export const TokenInfoButton = ({ onClick, size }: TokenInfoButtonProps) => (
  <IconButton variant="action" onClick={onClick}>
    <MouseoverTooltip text={t`Token Info`} placement="top" width="fit-content" disableTooltip={isMobile}>
      <Info className="text-subText" size={size || 20} />
    </MouseoverTooltip>
  </IconButton>
)

type HeaderRightMenuProps = {
  activeTab: TAB
  setActiveTab: (tab: TAB) => void
  activeMainTab?: TAB
}

export const HeaderRightMenu = ({ activeTab, setActiveTab, activeMainTab }: HeaderRightMenuProps) => {
  const { pathname } = useLocation()
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT) || activeMainTab === TAB.LIMIT
  const isSwapPage = isSwapLikePath(pathname) || activeMainTab === TAB.SWAP
  const isCrossChainPage = pathname.startsWith(APP_PATHS.CROSS_CHAIN) || activeMainTab === TAB.CROSS_CHAIN
  const defaultTab =
    activeMainTab || (isSwapPage ? TAB.SWAP : isLimitPage ? TAB.LIMIT : isCrossChainPage ? TAB.CROSS_CHAIN : TAB.SWAP)

  const { currencies } = useCurrenciesByPage()
  const { trackingHandler } = useTracking(currencies)

  const onToggleActionTab = (tab: TAB) => {
    if (activeTab === tab) {
      setActiveTab(defaultTab)
    } else {
      setActiveTab(tab)
    }
  }
  const [isDegenMode] = useDegenModeManager()
  const [slippage] = useUserSlippageTolerance()
  const [transactionTimeout] = useUserTransactionTTL()
  const { networkInfo } = useActiveWeb3React()
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)

  return (
    <div className="flex items-center gap-1">
      {!isCrossChainPage && (
        <TokenInfoButton
          size={upToXXSmall ? 16 : 20}
          onClick={() => {
            trackingHandler(TRACKING_EVENT_TYPE.SWAP_TOKEN_INFO_CLICK)
            onToggleActionTab(TAB.INFO)
          }}
        />
      )}
      {!isLimitPage && (
        <IconButton
          variant="action"
          active={activeTab === TAB.SETTINGS}
          onClick={() => {
            onToggleActionTab(TAB.SETTINGS)
            if (isCrossChainPage) {
              trackingHandler(TRACKING_EVENT_TYPE.CC_SETTINGS_OPENED, {
                current_max_slippage: formatSlippage(slippage, false),
              })
            } else {
              trackingHandler(TRACKING_EVENT_TYPE.SWAP_SETTINGS_CLICK, {
                current_max_slippage: formatSlippage(slippage, false),
                current_transaction_time_limit: transactionTimeout / 60,
                current_gas_token: networkInfo.nativeToken.symbol,
              })
            }
          }}
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
