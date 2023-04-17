import { Trans, t } from '@lingui/macro'
import { Dispatch, SetStateAction, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { MoreHorizontal } from 'react-feather'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { ReactComponent as TutorialSvg } from 'assets/svg/play_circle_outline.svg'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import { ShareButtonWithModal } from 'components/ShareModal'
import { MouseoverTooltip } from 'components/Tooltip'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import TokenInfoIcon from 'components/swapv2/TokenInfoIcon'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { Z_INDEXS } from 'constants/styles'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { TAB } from 'pages/SwapV3/index'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'
import { useDegenModeManager } from 'state/user/hooks'

const SwapFormActions = styled.div<{ isShowHeaderMenu: boolean }>`
  display: flex;
  align-items: center;
  z-index: ${Z_INDEXS.SWAP_PAGE_HEADER_RIGHT_MENU};
  position: relative;
`

const ActionPanel = styled.div`
  position: absolute;
  right: 0;
  display: flex;
  gap: 0.5rem;
  border-radius: 18px;
  background: ${({ theme }) => theme.background};
`

const TutorialIcon = styled(TutorialSvg)`
  width: 22px;
  height: 22px;
  path {
    fill: ${({ theme }) => theme.subText};
    stroke: ${({ theme }) => theme.subText};
  }
`

const StyledMoreHorizontal = styled(MoreHorizontal)`
  height: 36px;
  width: 36px;
  padding: 6px;
  cursor: pointer;
`

const TransactionSettingsIconWrapper = styled.span`
  line-height: 0;
`

export default function HeaderRightMenu({
  activeTab,
  setActiveTab,
}: {
  activeTab: TAB
  setActiveTab: Dispatch<SetStateAction<TAB>>
}) {
  const theme = useTheme()

  const [isShowHeaderMenu, setShowHeaderMenu] = useState(false)

  const { pathname } = useLocation()
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)

  const { currencies, shareUrl } = useCurrenciesByPage()
  const { mixpanelHandler } = useMixpanel(currencies)

  const onToggleActionTab = (tab: TAB) => setActiveTab(activeTab === tab ? (isLimitPage ? TAB.LIMIT : TAB.SWAP) : tab)

  const [isDegenMode] = useDegenModeManager()

  const onMouseEnterMenu = () => {
    if (isMobile) return
    setShowHeaderMenu(true)
  }
  const onMouseLeaveMenu = () => {
    if (isMobile) return
    setShowHeaderMenu(false)
  }
  const onClickMoreButton = () => {
    setShowHeaderMenu(prev => !prev)
  }

  return (
    <SwapFormActions
      onMouseEnter={onMouseEnterMenu}
      onMouseLeave={onMouseLeaveMenu}
      isShowHeaderMenu={isShowHeaderMenu}
    >
      <ActionPanel>
        {isShowHeaderMenu && (
          <>
            <Tutorial
              type={TutorialType.SWAP}
              customIcon={
                <StyledActionButtonSwapForm onClick={() => mixpanelHandler(MIXPANEL_TYPE.SWAP_TUTORIAL_CLICK)}>
                  <TutorialIcon />
                </StyledActionButtonSwapForm>
              }
            />
            <TokenInfoIcon
              currencies={currencies}
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.SWAP_TOKEN_INFO_CLICK)
                onToggleActionTab(TAB.INFO)
              }}
            />
            <ShareButtonWithModal
              title={t`Share this with your friends!`}
              url={shareUrl}
              onShared={() => {
                mixpanelHandler(MIXPANEL_TYPE.TOKEN_SWAP_LINK_SHARED)
              }}
            />
            <StyledActionButtonSwapForm
              active={activeTab === TAB.SETTINGS}
              onClick={() => {
                onToggleActionTab(TAB.SETTINGS)
                mixpanelHandler(MIXPANEL_TYPE.SWAP_SETTINGS_CLICK)
              }}
              aria-label="Swap Settings"
            >
              <MouseoverTooltip
                text={<Trans>Settings</Trans>}
                placement="top"
                width="fit-content"
                disableTooltip={isMobile}
              >
                <TransactionSettingsIconWrapper id={TutorialIds.BUTTON_SETTING_SWAP_FORM}>
                  <TransactionSettingsIcon fill={theme.subText} />
                </TransactionSettingsIconWrapper>
              </MouseoverTooltip>
            </StyledActionButtonSwapForm>
          </>
        )}
        <MouseoverTooltip
          text={<Trans>Degen mode is on. Be cautious!</Trans>}
          placement="top"
          width="fit-content"
          disableTooltip={!isDegenMode || isMobile}
        >
          <StyledMoreHorizontal color={isDegenMode ? theme.warning : theme.subText} onClick={onClickMoreButton} />
        </MouseoverTooltip>
      </ActionPanel>
    </SwapFormActions>
  )
}
