import { t } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import { MouseoverTooltip } from 'components/Tooltip'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import TokenInfoIcon from 'components/swapv2/TokenInfoIcon'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { TAB } from 'pages/SwapV3/index'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'
import { useDegenModeManager } from 'state/user/hooks'

const ActionPanel = styled.div`
  display: flex;
  gap: 0.5rem;
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
  const { mixpanelHandler } = useMixpanel(currencies)

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

  return (
    <ActionPanel>
      <TokenInfoIcon
        currencies={currencies}
        onClick={() => {
          mixpanelHandler(MIXPANEL_TYPE.SWAP_TOKEN_INFO_CLICK)
          onToggleActionTab(TAB.INFO)
        }}
      />
      {!isLimitPage && (
        <StyledActionButtonSwapForm
          active={activeTab === TAB.SETTINGS}
          onClick={() => {
            onToggleActionTab(TAB.SETTINGS)
            mixpanelHandler(MIXPANEL_TYPE.SWAP_SETTINGS_CLICK)
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
