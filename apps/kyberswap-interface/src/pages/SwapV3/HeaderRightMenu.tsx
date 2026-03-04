import { t } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import { MouseoverTooltip } from 'components/Tooltip'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import TokenInfoIcon from 'components/swapv2/TokenInfoIcon'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { TAB } from 'pages/SwapV3/index'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'
import { useDegenModeManager, usePaymentToken, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatSlippage } from 'utils/slippage'

const ActionPanel = styled.div`
  display: flex;
  align-items: center;
  border-radius: 18px;
`

const TransactionSettingsIconWrapper = styled.span`
  line-height: 0;
`

export default function HeaderRightMenu({
  activeTab,
  setActiveTab,
}: {
  activeTab: TAB
  setActiveTab: (tab: TAB) => void
}) {
  const theme = useTheme()

  const { pathname } = useLocation()
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)
  const isCrossChainPage = pathname.startsWith(APP_PATHS.CROSS_CHAIN)

  const { currencies } = useCurrenciesByPage()
  const { trackingHandler } = useTracking(currencies)

  const onToggleActionTab = (tab: TAB) => {
    if (activeTab === tab) {
      if (isSwapPage) setActiveTab(TAB.SWAP)
      else if (isLimitPage) setActiveTab(TAB.LIMIT)
      else if (isCrossChainPage) setActiveTab(TAB.CROSS_CHAIN)
    } else {
      setActiveTab(tab)
    }
  }
  const [isDegenMode] = useDegenModeManager()
  const [slippage] = useUserSlippageTolerance()
  const [transactionTimeout] = useUserTransactionTTL()
  const [paymentToken] = usePaymentToken()
  const { networkInfo } = useActiveWeb3React()
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)

  return (
    <ActionPanel>
      {!isCrossChainPage && (
        <TokenInfoIcon
          currencies={currencies}
          size={upToXXSmall ? 16 : 20}
          onClick={() => {
            trackingHandler(TRACKING_EVENT_TYPE.SWAP_TOKEN_INFO_CLICK)
            onToggleActionTab(TAB.INFO)
          }}
        />
      )}
      {!isLimitPage && (
        <StyledActionButtonSwapForm
          active={activeTab === TAB.SETTINGS}
          onClick={() => {
            onToggleActionTab(TAB.SETTINGS)
            trackingHandler(TRACKING_EVENT_TYPE.SWAP_SETTINGS_CLICK, {
              current_max_slippage: formatSlippage(slippage, false),
              current_transaction_time_limit: transactionTimeout / 60,
              current_gas_token: paymentToken?.symbol || networkInfo.nativeToken.symbol,
            })
          }}
          aria-label="Swap Settings"
        >
          <MouseoverTooltip
            text={isDegenMode ? t`Degen mode is on. Be cautious!` : t`Settings`}
            placement="top"
            width="fit-content"
            disableTooltip={isMobile}
          >
            <TransactionSettingsIconWrapper id={TutorialIds.BUTTON_SETTING_SWAP_FORM}>
              <TransactionSettingsIcon fill={isDegenMode ? theme.warning : theme.subText} />
            </TransactionSettingsIconWrapper>
          </MouseoverTooltip>
        </StyledActionButtonSwapForm>
      )}
    </ActionPanel>
  )
}
