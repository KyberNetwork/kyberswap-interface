import { Trans, t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import {
  Award,
  BookOpen,
  Edit,
  FileText,
  Info,
  Menu as MenuIcon,
  MessageCircle,
  PieChart,
  Share2,
  Triangle,
  UserPlus,
} from 'react-feather'
import { NavLink, useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as BlogIcon } from 'assets/svg/blog.svg'
import { ReactComponent as LightIcon } from 'assets/svg/light.svg'
import { ReactComponent as RoadMapIcon } from 'assets/svg/roadmap.svg'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import SlideToUnlock from 'components/Header/SlideToUnlock'
import ArrowRight from 'components/Icons/ArrowRight'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import Faucet from 'components/Icons/Faucet'
import MailIcon from 'components/Icons/MailIcon'
import LanguageSelector from 'components/LanguageSelector'
import Loader from 'components/Loader'
import MenuFlyout from 'components/MenuFlyout'
import Row, { AutoRow } from 'components/Row'
import NotificationModal from 'components/SubscribeButton/NotificationModal'
import Toggle from 'components/Toggle'
import ThemeToggle from 'components/Toggle/ThemeToggle'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { ENV_LEVEL, ENV_TYPE, TAG } from 'constants/env'
import { AGGREGATOR_ANALYTICS_URL, APP_PATHS, DMM_ANALYTICS_URL } from 'constants/index'
import { LOCALE_LABEL_V2, SupportedLocale } from 'constants/locales'
import { FAUCET_NETWORKS } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import useClaimReward from 'hooks/useClaimReward'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNotificationModalToggle, useToggleModal } from 'state/application/hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useDarkModeManager, useHolidayMode, useUserLocale } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { isChristmasTime } from 'utils'

import ClaimRewardModal from './ClaimRewardModal'
import FaucetModal from './FaucetModal'
import NavDropDown from './NavDropDown'

const sharedStylesMenuItem = css`
  flex: 1;
  padding: 0.7rem 0;
  text-decoration: none;
  display: flex;
  font-weight: 500;
  white-space: nowrap;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  font-size: 15px;

  :hover {
    color: ${({ theme }) => theme.text};
    cursor: pointer;
    text-decoration: none;
  }

  > svg {
    margin-right: 8px;
  }
`

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text};
  }
`

const StyledRoadMapIcon = styled(RoadMapIcon)`
  path {
    stroke: ${({ theme }) => theme.subText};
  }
`

const StyledBlogIcon = styled(BlogIcon)`
  path {
    fill: ${({ theme }) => theme.subText};
  }
`

const StyledLightIcon = styled(LightIcon)<{ color?: string }>`
  path {
    stroke: ${({ theme, color }) => color ?? theme.subText};
  }
`

const DiscoverWrapper = styled.span`
  display: none;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: inline-flex;
  `};
`

const CampaignWrapper = styled.span`
  display: none;

  /* It's better to break at 420px than at extraSmall */
  @media (max-width: 420px) {
    display: inline-flex;
  }
`

const StyledMenuButton = styled.button<{ active?: boolean }>`
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text};

  border-radius: 999px;

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
  }

  ${({ active }) =>
    active
      ? css`
          cursor: pointer;
          outline: none;
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

export const NavMenuItem = styled(NavLink)`
  ${sharedStylesMenuItem}
`

const NavMenuItemBetween = styled.div`
  ${sharedStylesMenuItem}
  justify-content: space-between;
  position: unset !important;
  max-height: 40px;
`
const noop = () => {
  //
}
export const ExternalNavMenuItem = styled(ExternalLink)`
  ${sharedStylesMenuItem}
`

const MenuButton = styled.div`
  ${sharedStylesMenuItem}
`

const MenuFlyoutBrowserStyle = css`
  min-width: unset;
  right: -8px;
  width: 230px;
  & ${ExternalNavMenuItem}:nth-child(1),
  & ${NavMenuItem}:nth-child(1) {
    padding-top: 0.75rem;
  }
`

const MenuFlyoutMobileStyle = css`
  overflow-y: scroll;
  & ${ExternalNavMenuItem}:nth-child(1),
  & ${NavMenuItem}:nth-child(1) {
    padding-top: 0.75rem;
  }
`
const ClaimRewardButton = styled(ButtonPrimary)`
  margin-top: 10px;
  padding: 11px;
  font-size: 14px;
  width: max-content;
  ${!isMobile &&
  css`
    margin-left: auto;
    margin-right: auto;
  `}
`

export const NewLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.red};
  height: calc(100% + 4px);
  margin-left: 2px;
`
const Divider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
  margin-top: 10px;
  margin-bottom: 10px;
`

const Title = styled.div`
  ${sharedStylesMenuItem}
  font-weight: 500;
  font-size: 16px;
  color: ${({ theme }) => theme.text};
`

export default function Menu() {
  const { chainId, account, isEVM, networkInfo } = useActiveWeb3React()
  const theme = useTheme()
  const node = useRef<HTMLDivElement>(null)

  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  const toggleNotificationModal = useNotificationModalToggle()

  const [darkMode, toggleSetDarkMode] = useDarkModeManager()
  const [holidayMode, toggleHolidayMode] = useHolidayMode()
  const [isSelectingLanguage, setIsSelectingLanguage] = useState(false)

  const userLocale = useUserLocale()
  const location = useLocation()

  const { mixpanelHandler } = useMixpanel()

  const setShowTutorialSwapGuide = useTutorialSwapGuide()[1]
  const openTutorialSwapGuide = () => {
    setShowTutorialSwapGuide({ show: true, step: 0 })
    mixpanelHandler(MIXPANEL_TYPE.TUTORIAL_CLICK_START)
    toggle()
  }
  const under1440 = useMedia('(max-width: 1440px)')
  const above1321 = useMedia('(min-width: 1321px)')
  const under1200 = useMedia('(max-width: 1200px)')

  const bridgeLink = networkInfo.bridgeURL
  const toggleClaimPopup = useToggleModal(ApplicationModal.CLAIM_POPUP)
  const toggleFaucetPopup = useToggleModal(ApplicationModal.FAUCET_POPUP)
  const { pendingTx } = useClaimReward()

  useEffect(() => {
    if (!open) setIsSelectingLanguage(false)
  }, [open])

  return (
    <StyledMenu ref={node}>
      <StyledMenuButton active={open} onClick={toggle} aria-label="Menu" id={TutorialIds.BUTTON_SETTING}>
        <StyledMenuIcon />
      </StyledMenuButton>

      <MenuFlyout
        node={node}
        browserCustomStyle={MenuFlyoutBrowserStyle}
        mobileCustomStyle={MenuFlyoutMobileStyle}
        isOpen={open}
        toggle={toggle}
        hasArrow
      >
        {isSelectingLanguage ? (
          <AutoColumn gap="md">
            <LanguageSelector setIsSelectingLanguage={setIsSelectingLanguage} />
          </AutoColumn>
        ) : (
          <>
            <Title style={{ paddingTop: 0 }}>
              <Trans>Menu</Trans>
            </Title>
            {FAUCET_NETWORKS.includes(chainId) && (
              <MenuButton
                onClick={() => {
                  toggleFaucetPopup()
                  mixpanelHandler(MIXPANEL_TYPE.FAUCET_MENU_CLICKED)
                }}
              >
                <Faucet />
                <Text width="max-content">
                  <Trans>Faucet</Trans>
                </Text>
              </MenuButton>
            )}

            {bridgeLink && (
              <ExternalNavMenuItem href={bridgeLink}>
                <Share2 size={14} />
                <Text width="max-content">
                  <Trans>Bridge Assets</Trans>
                </Text>
              </ExternalNavMenuItem>
            )}

            <DiscoverWrapper>
              <NavMenuItem to={'/discover?tab=trending_soon'} onClick={toggle}>
                <DiscoverIcon size={16} />
                <SlideToUnlock>
                  <Text width="max-content">
                    <Trans>Discover</Trans>
                  </Text>
                </SlideToUnlock>
                <NewLabel>
                  <Trans>New</Trans>
                </NewLabel>
              </NavMenuItem>
            </DiscoverWrapper>

            <CampaignWrapper>
              <NavMenuItem to="/campaigns" onClick={toggle}>
                <Award size={14} />
                <Trans>Campaigns</Trans>
              </NavMenuItem>
            </CampaignWrapper>

            {under1440 && (
              <NavDropDown
                icon={<Info size={16} />}
                title={'About'}
                link={'/about'}
                options={[
                  { link: '/about/kyberswap', label: 'Kyberswap' },
                  { link: '/about/knc', label: 'KNC' },
                ]}
              />
            )}

            <NavMenuItem to="/referral" onClick={toggle}>
              <UserPlus size={16} />
              <Trans>Referral</Trans>
            </NavMenuItem>
            {under1200 && (
              <>
                <NavDropDown
                  icon={<Info size={16} />}
                  title={'KyberDAO'}
                  link={'/kyberdao/stake-knc'}
                  options={[
                    { link: '/kyberdao/stake-knc', label: 'Stake KNC' },
                    { link: '/kyberdao/vote', label: 'Vote' },
                  ]}
                />
                <ExternalNavMenuItem href="https://kyberswap.canny.io/feature-request" onClick={toggle}>
                  <StyledLightIcon />
                  <Trans>Feature Request</Trans>
                </ExternalNavMenuItem>
              </>
            )}
            {!above1321 && (
              <NavDropDown
                icon={<PieChart size={16} />}
                link="#"
                title={'Analytics'}
                options={[
                  { link: DMM_ANALYTICS_URL[chainId], label: t`Liquidity`, external: true },
                  {
                    link: AGGREGATOR_ANALYTICS_URL,
                    label: t`Aggregator`,
                    external: true,
                  },
                ]}
              />
            )}
            <ExternalNavMenuItem href="https://docs.kyberswap.com">
              <BookOpen size={16} />
              <Trans>Docs</Trans>
            </ExternalNavMenuItem>

            <ExternalNavMenuItem href="https://kyberswap.canny.io/" onClick={toggle}>
              <StyledRoadMapIcon />
              <Trans>Roadmap</Trans>
            </ExternalNavMenuItem>

            <ExternalNavMenuItem href="https://gov.kyber.org">
              <MessageCircle size={16} />
              <Trans>Forum</Trans>
            </ExternalNavMenuItem>

            {under1440 && (
              <ExternalNavMenuItem href="https://blog.kyberswap.com">
                <StyledBlogIcon />
                <Trans>Blog</Trans>
              </ExternalNavMenuItem>
            )}

            <ExternalNavMenuItem href="/15022022KyberSwapTermsofUse.pdf">
              <FileText size={16} />
              <Trans>Terms</Trans>
            </ExternalNavMenuItem>
            {ENV_LEVEL < ENV_TYPE.PROD && (
              <NavMenuItem to="/swap-legacy" onClick={toggle}>
                <Triangle size={14} />
                <Trans>Swap Legacy</Trans>
              </NavMenuItem>
            )}
            <ExternalNavMenuItem href="https://forms.gle/gLiNsi7iUzHws2BY8">
              <Edit size={16} />
              <Trans>Business Enquiries</Trans>
            </ExternalNavMenuItem>

            <Divider />

            <Title>
              <Trans>Preferences</Trans>
            </Title>

            {location.pathname.startsWith(APP_PATHS.SWAP) && (
              <NavMenuItemBetween
                id={TutorialIds.BUTTON_VIEW_GUIDE_SWAP}
                onClick={() => {
                  toggle()
                  openTutorialSwapGuide()
                }}
              >
                <Trans>Swap Guide</Trans>
                <Row justify="flex-end">
                  <Text color={theme.text}>View</Text>&nbsp;
                  <StyledLightIcon color={theme.text} />
                </Row>
              </NavMenuItemBetween>
            )}
            {isChristmasTime() && (
              <NavMenuItemBetween onClick={toggleHolidayMode}>
                <Trans>Holiday Mode</Trans>
                <Toggle isActive={holidayMode} toggle={noop} />
              </NavMenuItemBetween>
            )}

            <NavMenuItemBetween onClick={toggleSetDarkMode}>
              <Trans>Dark Mode</Trans>
              <ThemeToggle id="toggle-dark-mode-button" isDarkMode={darkMode} toggle={noop} />
            </NavMenuItemBetween>
            <NavMenuItemBetween
              onClick={() => {
                toggleNotificationModal()
                mixpanelHandler(MIXPANEL_TYPE.NOTIFICATION_CLICK_MENU)
              }}
            >
              <Trans>Notifications</Trans>
              <MailIcon size={17} color={theme.text} />
            </NavMenuItemBetween>
            <NavMenuItemBetween onClick={() => setIsSelectingLanguage(true)}>
              <Trans>Language</Trans>
              <ButtonEmpty
                padding="0"
                width="fit-content"
                style={{ color: theme.text, textDecoration: 'none', fontSize: '14px' }}
              >
                {LOCALE_LABEL_V2[userLocale as SupportedLocale] || LOCALE_LABEL_V2['en-US']}&nbsp;&nbsp;
                <ArrowRight fill={theme.text} />
              </ButtonEmpty>
            </NavMenuItemBetween>

            <Divider />

            <AutoRow justify="center">
              <ClaimRewardButton
                disabled={!account || !isEVM || !(networkInfo as EVMNetworkInfo).classic.claimReward || pendingTx}
                onClick={() => {
                  mixpanelHandler(MIXPANEL_TYPE.CLAIM_REWARDS_INITIATED)
                  toggleClaimPopup()
                }}
              >
                {pendingTx ? (
                  <>
                    <Loader style={{ marginRight: '5px' }} stroke={theme.disableText} /> <Trans>Claiming...</Trans>
                  </>
                ) : (
                  <Trans>Claim Rewards</Trans>
                )}
              </ClaimRewardButton>
            </AutoRow>

            <Text fontSize="10px" fontWeight={300} color={theme.subText} mt="16px" textAlign={'center'}>
              kyberswap@{TAG}
            </Text>
          </>
        )}
      </MenuFlyout>

      <ClaimRewardModal />
      <NotificationModal />
      {FAUCET_NETWORKS.includes(chainId) && <FaucetModal />}
    </StyledMenu>
  )
}
