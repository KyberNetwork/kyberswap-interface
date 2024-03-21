import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { AlertOctagon, BookOpen, ChevronDown, FileText, Info, MessageCircle, PieChart } from 'react-feather'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as MenuIcon } from 'assets/svg/all_icon.svg'
import { ReactComponent as BlogIcon } from 'assets/svg/blog.svg'
import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { ReactComponent as LightIcon } from 'assets/svg/light.svg'
import { ReactComponent as RoadMapIcon } from 'assets/svg/roadmap.svg'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import ArrowRight from 'components/Icons/ArrowRight'
import Faucet from 'components/Icons/Faucet'
import Icon from 'components/Icons/Icon'
import MailIcon from 'components/Icons/MailIcon'
import LanguageSelector from 'components/LanguageSelector'
import Loader from 'components/Loader'
import MenuFlyout from 'components/MenuFlyout'
import Row, { AutoRow } from 'components/Row'
import Toggle from 'components/Toggle'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { ENV_LEVEL, TAG } from 'constants/env'
import { AGGREGATOR_ANALYTICS_URL, APP_PATHS, TERM_FILES_PATH } from 'constants/index'
import { getLocaleLabel } from 'constants/locales'
import { FAUCET_NETWORKS } from 'constants/networks'
import { ENV_TYPE } from 'constants/type'
import { useActiveWeb3React } from 'hooks'
import useClaimReward from 'hooks/useClaimReward'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useHolidayMode, useUserLocale } from 'state/user/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { isChristmasTime } from 'utils'

import ClaimRewardModal from './ClaimRewardModal'
import FaucetModal from './FaucetModal'
import NavDropDown from './NavDropDown'

const MenuItem = styled.li`
  flex: 1;
  padding: 0.75rem 0;
  text-decoration: none;
  display: flex;
  font-weight: 500;
  white-space: nowrap;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  font-size: 15px;

  svg {
    margin-right: 8px;
    height: 16px;
    width: 16px;
  }

  a {
    color: ${({ theme }) => theme.subText};
    display: flex;
    align-items: center;
    :hover {
      text-decoration: none;
      color: ${({ theme }) => theme.text};
    }
  }
`

const NavLinkBetween = styled(MenuItem)`
  justify-content: space-between;
  position: unset !important;
  max-height: 40px;
  cursor: pointer;
  svg {
    margin: 0;
    width: unset;
    height: unset;
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
  color: ${({ theme }) => theme.subText};

  border-radius: 999px;

  :hover {
    cursor: pointer;
    outline: none;
  }

  ${({ active }) =>
    active &&
    css`
      cursor: pointer;
      outline: none;
      color: ${({ theme }) => theme.text};
    `}
`

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const ListWrapper = styled.div`
  max-height: calc(100vh - 150px);
  overflow-y: scroll;
`

const MenuFlyoutBrowserStyle = css`
  min-width: unset;
  right: -8px;
  width: 230px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 3.5rem;
  `};
`

const MenuFlyoutMobileStyle = css`
  overflow-y: scroll;
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

const Title = styled(MenuItem)`
  font-weight: 500;
  font-size: 16px;
  color: ${({ theme }) => theme.text};
`

const ScrollEnd = styled.div<{ show: boolean }>`
  visibility: ${({ show }) => (show ? 'initial' : 'hidden')};
  position: sticky !important;
  width: 100%;
  text-align: center;
  z-index: 2;
  @keyframes floating {
    from {
      bottom: 10px;
    }
    to {
      bottom: -10px;
    }
  }
  animation-name: floating;
  animation-duration: 1s;
  animation-timing-function: ease;
  animation-iteration-count: infinite;
  animation-direction: alternate-reverse;
`

const noop = () => {}

export default function Menu() {
  const { chainId, account, networkInfo } = useActiveWeb3React()
  const theme = useTheme()

  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  const [holidayMode, toggleHolidayMode] = useHolidayMode()
  const [isSelectingLanguage, setIsSelectingLanguage] = useState(false)

  const userLocale = useUserLocale()
  const location = useLocation()

  const { mixpanelHandler } = useMixpanel()
  const navigate = useNavigate()

  const setShowTutorialSwapGuide = useTutorialSwapGuide()[1]
  const openTutorialSwapGuide = () => {
    setShowTutorialSwapGuide({ show: true, step: 0 })
    mixpanelHandler(MIXPANEL_TYPE.TUTORIAL_CLICK_START)
    toggle()
  }

  const showAbout = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const showBlog = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const showAnalytics = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const bridgeLink = networkInfo.bridgeURL
  const toggleClaimPopup = useToggleModal(ApplicationModal.CLAIM_POPUP)
  const toggleFaucetPopup = useToggleModal(ApplicationModal.FAUCET_POPUP)
  const { pendingTx } = useClaimReward()

  useEffect(() => {
    if (!open) setIsSelectingLanguage(false)
  }, [open])

  const handleMenuClickMixpanel = (name: string) => {
    mixpanelHandler(MIXPANEL_TYPE.MENU_MENU_CLICK, { menu: name })
  }
  const handlePreferenceClickMixpanel = (name: string) => {
    mixpanelHandler(MIXPANEL_TYPE.MENU_PREFERENCE_CLICK, { menu: name })
  }

  const [wrapperNode, setWrapperNode] = useState<HTMLDivElement | null>(null)
  const [showScroll, setShowScroll] = useState<boolean>(false)

  useEffect(() => {
    if (wrapperNode) {
      const abortController = new AbortController()
      const onScroll = () => {
        if (abortController.signal.aborted) return
        setShowScroll(Math.abs(wrapperNode.offsetHeight + wrapperNode.scrollTop - wrapperNode.scrollHeight) > 10) //no need to show scroll down when scrolled to last 10px
      }
      onScroll()
      wrapperNode.addEventListener('scroll', onScroll)
      window.addEventListener('resize', onScroll)
      return () => {
        abortController.abort()
        wrapperNode.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
      }
    }
    return
  }, [wrapperNode])

  return (
    <StyledMenu>
      <MenuFlyout
        trigger={
          <StyledMenuButton active={open} onClick={toggle} aria-label="Menu" id={TutorialIds.BUTTON_MENU_HEADER}>
            <MenuIcon width={18} height={18} />
          </StyledMenuButton>
        }
        customStyle={MenuFlyoutBrowserStyle}
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
          <ListWrapper ref={wrapperNode => setWrapperNode(wrapperNode)}>
            <Title style={{ paddingTop: 0 }}>
              <Trans>Legacy</Trans>
            </Title>

            <MenuItem onClick={toggle}>
              <NavLink to={APP_PATHS.ELASTIC_SNAPSHOT}>
                <AlertOctagon size={14} />
                <Trans>Snapshot</Trans>
              </NavLink>
            </MenuItem>

            <MenuItem onClick={toggle}>
              <NavLink to={APP_PATHS.MY_POOLS}>
                <Icon id="liquid-outline" size={16} />
                <Trans>My Pools</Trans>
              </NavLink>
            </MenuItem>

            <Divider />

            <Title style={{ paddingTop: 0 }}>
              <Trans>Menu</Trans>
            </Title>
            {FAUCET_NETWORKS.includes(chainId) && (
              <MenuItem
                onClick={() => {
                  toggleFaucetPopup()
                  mixpanelHandler(MIXPANEL_TYPE.FAUCET_MENU_CLICKED)
                  handleMenuClickMixpanel('Faucet')
                }}
              >
                <Faucet />
                <Text width="max-content">
                  <Trans>Faucet</Trans>
                </Text>
              </MenuItem>
            )}

            {bridgeLink && (
              <MenuItem>
                <ExternalLink href={bridgeLink}>
                  <BridgeIcon />
                  <Trans>Bridge Assets</Trans>
                </ExternalLink>
              </MenuItem>
            )}

            {showAnalytics && (
              <MenuItem>
                <ExternalLink href={AGGREGATOR_ANALYTICS_URL}>
                  <PieChart />
                  <Trans>Analytics</Trans>
                </ExternalLink>
              </MenuItem>
            )}
            {showAbout && (
              <MenuItem>
                <NavDropDown
                  icon={<Info />}
                  title={t`About`}
                  link={'/about'}
                  options={[
                    { link: '/about/kyberswap', label: 'KyberSwap' },
                    { link: '/about/knc', label: 'KNC' },
                  ]}
                />
              </MenuItem>
            )}

            <MenuItem>
              <ExternalLink
                href="https://docs.kyberswap.com"
                onClick={() => {
                  handleMenuClickMixpanel('Docs')
                }}
              >
                <BookOpen />
                <Trans>Docs</Trans>
              </ExternalLink>
            </MenuItem>

            <MenuItem>
              <ExternalLink
                href="https://kyberswap.canny.io/"
                onClick={() => {
                  toggle()
                  handleMenuClickMixpanel('Roadmap')
                }}
              >
                <RoadMapIcon />
                <Trans>Roadmap</Trans>
              </ExternalLink>
            </MenuItem>

            <MenuItem>
              <ExternalLink
                href="https://gov.kyber.org"
                onClick={() => {
                  toggle()
                  handleMenuClickMixpanel('Forum')
                }}
              >
                <MessageCircle />
                <Trans>Forum</Trans>
              </ExternalLink>
            </MenuItem>

            {showBlog && (
              <MenuItem>
                <ExternalLink href="https://blog.kyberswap.com">
                  <BlogIcon />
                  <Trans>Blog</Trans>
                </ExternalLink>
              </MenuItem>
            )}

            <MenuItem>
              <ExternalLink
                href={TERM_FILES_PATH.KYBERSWAP_TERMS}
                onClick={() => {
                  toggle()
                  handleMenuClickMixpanel('Terms')
                }}
              >
                <FileText />
                <Trans>Terms</Trans>
              </ExternalLink>
            </MenuItem>
            <MenuItem>
              <ExternalLink
                href={TERM_FILES_PATH.PRIVACY_POLICY}
                onClick={() => {
                  toggle()
                  handleMenuClickMixpanel('Privacy Policy')
                }}
              >
                <FileText />
                <Trans>Privacy Policy</Trans>
              </ExternalLink>
            </MenuItem>
            {ENV_LEVEL === ENV_TYPE.LOCAL && (
              <MenuItem>
                <NavLink to="/icons">
                  <MenuIcon />
                  <Trans>Icons</Trans>
                </NavLink>
              </MenuItem>
            )}
            <Divider />

            <Title>
              <Trans>Preferences</Trans>
            </Title>

            {location.pathname.startsWith(APP_PATHS.SWAP) && (
              <NavLinkBetween
                id={TutorialIds.BUTTON_VIEW_GUIDE_SWAP}
                onClick={() => {
                  toggle()
                  openTutorialSwapGuide()
                  handlePreferenceClickMixpanel('Swap guide')
                }}
              >
                <Trans>KyberSwap Guide</Trans>
                <Row justify="flex-end">
                  <Text color={theme.text}>View</Text>&nbsp;
                  <LightIcon color={theme.text} />
                </Row>
              </NavLinkBetween>
            )}
            {isChristmasTime() && (
              <NavLinkBetween onClick={toggleHolidayMode}>
                <Trans>Holiday Mode</Trans>
                <Toggle isActive={holidayMode} toggle={noop} />
              </NavLinkBetween>
            )}

            <NavLinkBetween
              onClick={() => {
                navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PREFERENCE}`)
                mixpanelHandler(MIXPANEL_TYPE.NOTIFICATION_CLICK_MENU)
                handlePreferenceClickMixpanel('Notifications')
                toggle()
              }}
            >
              <Trans>Notification Center</Trans>
              <MailIcon size={17} color={theme.text} />
            </NavLinkBetween>
            <NavLinkBetween
              onClick={() => {
                setIsSelectingLanguage(true)
                handlePreferenceClickMixpanel('Language')
              }}
            >
              <Trans>Language</Trans>
              <ButtonEmpty
                padding="0"
                width="fit-content"
                style={{ color: theme.text, textDecoration: 'none', fontSize: '14px' }}
              >
                {getLocaleLabel(userLocale, true)}&nbsp;&nbsp;
                <ArrowRight fill={theme.text} />
              </ButtonEmpty>
            </NavLinkBetween>

            <Divider />

            <AutoRow justify="center">
              <ClaimRewardButton
                disabled={!account || !networkInfo.classic.claimReward || pendingTx}
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
            <ScrollEnd show={showScroll}>
              <ChevronDown color={theme.text4} />
            </ScrollEnd>
          </ListWrapper>
        )}
      </MenuFlyout>

      <ClaimRewardModal />
      {FAUCET_NETWORKS.includes(chainId) && <FaucetModal />}
    </StyledMenu>
  )
}
