import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { AlertOctagon, BookOpen, ChevronDown, FileText, Info, MessageCircle, PieChart, X } from 'react-feather'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ReactComponent as MenuIcon } from 'assets/svg/all_icon.svg'
import { ReactComponent as BlogIcon } from 'assets/svg/blog.svg'
import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { ReactComponent as TipLinkIcon } from 'assets/svg/earn/ic_tip_link.svg'
import { ReactComponent as LightIcon } from 'assets/svg/light.svg'
import { ReactComponent as RoadMapIcon } from 'assets/svg/roadmap.svg'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import ArrowRight from 'components/Icons/ArrowRight'
import CampaignIcon from 'components/Icons/CampaignIcon'
import Faucet from 'components/Icons/Faucet'
import Icon from 'components/Icons/Icon'
import MailIcon from 'components/Icons/MailIcon'
import VoteIcon from 'components/Icons/Vote'
import LanguageSelector from 'components/LanguageSelector'
import Loader from 'components/Loader'
import ClaimRewardModal from 'components/Menu/ClaimRewardModal'
import FaucetModal from 'components/Menu/FaucetModal'
import NavDropDown from 'components/Menu/NavDropDown'
import MenuFlyout from 'components/MenuFlyout'
import Row, { AutoRow } from 'components/Row'
import TipLinkGeneratorModal from 'components/TipLinkGeneratorModal'
import Toggle from 'components/Toggle'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { ENV_LEVEL, TAG } from 'constants/env'
import { AGGREGATOR_ANALYTICS_URL, APP_PATHS, TERM_FILES_PATH } from 'constants/index'
import { getLocaleLabel } from 'constants/locales'
import { FAUCET_NETWORKS } from 'constants/networks'
import { ENV_TYPE } from 'constants/type'
import { useActiveWeb3React } from 'hooks'
import useClaimReward from 'hooks/useClaimReward'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useHolidayMode, useUserLocale } from 'state/user/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { isChristmasTime } from 'utils'
import { cn } from 'utils/cn'

// Base style for each menu list item — color/font, hover, embedded icon spacing.
const MENU_ITEM_CLASS = cn(
  'flex flex-1 items-center whitespace-nowrap py-3 text-[15px] font-medium text-subText no-underline',
  '[&_svg]:mr-2 [&_svg]:size-4',
  '[&_a]:flex [&_a]:items-center [&_a]:text-subText hover:[&_a]:text-text hover:[&_a]:no-underline',
)

const MenuItem = ({
  children,
  onClick,
  id,
  style,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  id?: string
  style?: React.CSSProperties
  className?: string
}) => (
  <li id={id} onClick={onClick} style={style} className={cn(MENU_ITEM_CLASS, className)}>
    {children}
  </li>
)

const NavLinkBetween = ({
  children,
  onClick,
  id,
}: {
  children: React.ReactNode
  onClick?: () => void
  id?: string
}) => (
  <li
    id={id}
    onClick={onClick}
    className={cn(
      MENU_ITEM_CLASS,
      '!static max-h-10 cursor-pointer justify-between',
      '[&_svg]:m-0 [&_svg]:!h-auto [&_svg]:!w-auto',
    )}
  >
    {children}
  </li>
)

const MENU_FLYOUT_BROWSER_CLASS = '!min-w-0 !right-[-8px] !w-[230px] max-lg:!top-auto max-lg:!bottom-14'
const MENU_FLYOUT_MOBILE_CLASS = 'overflow-y-scroll'

export const NewLabel = ({ isNew, children }: { isNew?: boolean; children: React.ReactNode }) => (
  <span className={cn('ml-1 text-[10px]', isNew ? 'text-red' : 'text-subText')}>{children}</span>
)

const Divider = () => <div className="my-2.5 border-t border-border" />

const Title = ({
  children,
  style,
  className,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) => (
  <li style={style} className={cn(MENU_ITEM_CLASS, 'text-base !text-text', '[&_svg]:mr-2 [&_svg]:size-4', className)}>
    {children}
  </li>
)

const noop = () => {}
const TIP_LINK_MODAL_QUERY_KEY = 'modal'
const TIP_LINK_MODAL_QUERY_VALUE = 'tip-link-generator'

export default function Menu() {
  const { chainId, account, networkInfo } = useActiveWeb3React()

  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  const [holidayMode, toggleHolidayMode] = useHolidayMode()
  const [isSelectingLanguage, setIsSelectingLanguage] = useState(false)
  const [showTipLinkGenerator, setShowTipLinkGenerator] = useState(false)

  const userLocale = useUserLocale()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const { trackingHandler } = useTracking()
  const navigate = useNavigate()

  const setShowTutorialSwapGuide = useTutorialSwapGuide()[1]
  const openTutorialSwapGuide = () => {
    setShowTutorialSwapGuide({ show: true, step: 0 })
    trackingHandler(TRACKING_EVENT_TYPE.TUTORIAL_CLICK_START)
    toggle()
  }

  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const bridgeLink = networkInfo.bridgeURL
  const toggleClaimPopup = useToggleModal(ApplicationModal.CLAIM_POPUP)
  const toggleFaucetPopup = useToggleModal(ApplicationModal.FAUCET_POPUP)
  const { pendingTx } = useClaimReward()

  const openTipLinkGenerator = () => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set(TIP_LINK_MODAL_QUERY_KEY, TIP_LINK_MODAL_QUERY_VALUE)
    setSearchParams(nextSearchParams, { replace: true })
    setShowTipLinkGenerator(true)
  }

  const closeTipLinkGenerator = () => {
    const nextSearchParams = new URLSearchParams(searchParams)
    if (nextSearchParams.get(TIP_LINK_MODAL_QUERY_KEY) === TIP_LINK_MODAL_QUERY_VALUE) {
      nextSearchParams.delete(TIP_LINK_MODAL_QUERY_KEY)
      setSearchParams(nextSearchParams, { replace: true })
    }
    setShowTipLinkGenerator(false)
  }

  useEffect(() => {
    setShowTipLinkGenerator(searchParams.get(TIP_LINK_MODAL_QUERY_KEY) === TIP_LINK_MODAL_QUERY_VALUE)
  }, [searchParams])

  useEffect(() => {
    if (!open) setIsSelectingLanguage(false)
  }, [open])

  const handleMenuClickMixpanel = (name: string) => {
    trackingHandler(TRACKING_EVENT_TYPE.MENU_MENU_CLICK, { menu: name })
  }
  const handlePreferenceClickMixpanel = (name: string) => {
    trackingHandler(TRACKING_EVENT_TYPE.MENU_PREFERENCE_CLICK, { menu: name })
  }

  const [wrapperNode, setWrapperNode] = useState<HTMLDivElement | null>(null)
  const [showScroll, setShowScroll] = useState<boolean>(false)

  useEffect(() => {
    if (wrapperNode) {
      const abortController = new AbortController()
      const onScroll = () => {
        if (abortController.signal.aborted) return
        setShowScroll(Math.abs(wrapperNode.offsetHeight + wrapperNode.scrollTop - wrapperNode.scrollHeight) > 10)
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
    <div className="relative flex items-center justify-center border-none text-left">
      <MenuFlyout
        trigger={
          <button
            onClick={() => {
              if (!open) {
                trackingHandler(TRACKING_EVENT_TYPE.MENU_DROPDOWN_OPENED, {})
              }
              toggle()
            }}
            aria-label="Menu"
            id={TutorialIds.BUTTON_MENU_HEADER}
            className={cn(
              'm-0 flex size-10 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 outline-none hover:text-text',
              open ? 'text-text' : 'text-subText',
            )}
          >
            <MenuIcon width={18} height={18} />
          </button>
        }
        className={MENU_FLYOUT_BROWSER_CLASS}
        mobileClassName={MENU_FLYOUT_MOBILE_CLASS}
        isOpen={open}
        toggle={toggle}
        hasArrow
      >
        {isSelectingLanguage ? (
          <AutoColumn className="gap-3">
            <LanguageSelector
              setIsSelectingLanguage={setIsSelectingLanguage}
              onLanguageChange={(prevLang, newLang) => {
                trackingHandler(TRACKING_EVENT_TYPE.LANGUAGE_CHANGED, {
                  previous_language: prevLang,
                  new_language: newLang,
                  source: 'menu_dropdown',
                })
              }}
            />
          </AutoColumn>
        ) : (
          <div
            ref={wrapperNode => setWrapperNode(wrapperNode)}
            className="relative max-h-[calc(100vh-150px)] overflow-y-scroll"
          >
            {isMobile && (
              <ButtonEmpty onClick={toggle} className="absolute right-0 top-0 w-fit p-0">
                <X className="text-subText" />
              </ButtonEmpty>
            )}

            <Title className="pt-0">
              <Trans>Legacy</Trans>
            </Title>

            <MenuItem onClick={toggle}>
              <NavLink to={APP_PATHS.ELASTIC_SNAPSHOT}>
                <AlertOctagon size={14} />
                <Trans>Treasury Grant 2023</Trans>
              </NavLink>
            </MenuItem>

            <MenuItem onClick={toggle}>
              <NavLink to={APP_PATHS.MY_POOLS}>
                <Icon id="liquid-outline" size={16} />
                <Trans>My Pools</Trans>
              </NavLink>
            </MenuItem>

            <Divider />

            <Title className="pt-0">
              <Trans>Menu</Trans>
            </Title>
            <MenuItem
              onClick={() => {
                openTipLinkGenerator()
                handleMenuClickMixpanel('Tip Link Generator')
                toggle()
              }}
              className="cursor-pointer hover:text-text"
            >
              <TipLinkIcon />
              <span>
                <Trans>Tip Link Generator</Trans>
              </span>
            </MenuItem>
            {FAUCET_NETWORKS.includes(chainId) && (
              <MenuItem
                onClick={() => {
                  toggleFaucetPopup()
                  trackingHandler(TRACKING_EVENT_TYPE.FAUCET_MENU_CLICKED)
                  handleMenuClickMixpanel('Faucet')
                }}
              >
                <Faucet />
                <span className="w-max">
                  <Trans>Faucet</Trans>
                </span>
              </MenuItem>
            )}
            {upToExtraSmall && (
              <NavLink to={APP_PATHS.MARKET_OVERVIEW}>
                <MenuItem onClick={() => navigate(APP_PATHS.MARKET_OVERVIEW)}>
                  <PieChart />
                  <span>
                    <Trans>Market</Trans>
                  </span>
                </MenuItem>
              </NavLink>
            )}

            {upToMedium && (
              <MenuItem>
                <NavDropDown
                  icon={<VoteIcon />}
                  title={
                    <span className="relative w-max">
                      <Trans>KyberDAO</Trans>
                    </span>
                  }
                  link={'/campaigns'}
                  options={[
                    { link: APP_PATHS.KYBERDAO_STAKE, label: t`Stake KNC` },
                    { link: APP_PATHS.KYBERDAO_VOTE, label: t`Vote` },
                    { link: APP_PATHS.KYBERDAO_KNC_UTILITY, label: t`KNC Utility` },
                    { link: 'https://discord.gg/cqwvAuYp3H', label: t`Feature Request`, external: true },
                  ]}
                />
              </MenuItem>
            )}

            {upToXXSmall && (
              <MenuItem>
                <NavDropDown
                  icon={<CampaignIcon />}
                  title={
                    <span className="relative w-max">
                      <Trans>Campaigns</Trans>
                    </span>
                  }
                  link="/campaigns"
                  options={[
                    { link: APP_PATHS.SAFEPAL_CAMPAIGN, label: t`SafePal Campaign` },
                    { link: APP_PATHS.RAFFLE_CAMPAIGN, label: t`Weekly Rewards` },
                    { link: APP_PATHS.NEAR_INTENTS_CAMPAIGN, label: t`Cross Chain Campaign` },
                    { link: APP_PATHS.MAY_TRADING_CAMPAIGN, label: t`May Trading` },
                    { link: APP_PATHS.AGGREGATOR_CAMPAIGN, label: t`Aggregator Trading` },
                    { link: APP_PATHS.LIMIT_ORDER_CAMPAIGN, label: t`Limit Order` },
                    { link: APP_PATHS.REFFERAL_CAMPAIGN, label: t`Referral` },
                    { link: APP_PATHS.MY_DASHBOARD, label: t`My Dashboard`, external: true },
                  ]}
                />
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

            {upToMedium && (
              <>
                <MenuItem>
                  <ExternalLink href={AGGREGATOR_ANALYTICS_URL}>
                    <PieChart />
                    <Trans>Analytics</Trans>
                  </ExternalLink>
                </MenuItem>

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
              </>
            )}

            <MenuItem>
              <ExternalLink
                href="https://docs.kyberswap.com"
                onClick={() => {
                  handleMenuClickMixpanel('Docs')
                  trackingHandler(TRACKING_EVENT_TYPE.MENU_LINK_CLICKED, {
                    item_label: 'Docs',
                    item_url: 'https://docs.kyberswap.com',
                    is_external: true,
                  })
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
                  trackingHandler(TRACKING_EVENT_TYPE.MENU_LINK_CLICKED, {
                    item_label: 'Roadmap',
                    item_url: 'https://kyberswap.canny.io/',
                    is_external: true,
                  })
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
                  trackingHandler(TRACKING_EVENT_TYPE.MENU_LINK_CLICKED, {
                    item_label: 'Forum',
                    item_url: 'https://gov.kyber.org',
                    is_external: true,
                  })
                }}
              >
                <MessageCircle />
                <Trans>Forum</Trans>
              </ExternalLink>
            </MenuItem>

            {upToExtraSmall && (
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
                  trackingHandler(TRACKING_EVENT_TYPE.MENU_LINK_CLICKED, {
                    item_label: 'Terms',
                    item_url: TERM_FILES_PATH.KYBERSWAP_TERMS,
                    is_external: true,
                  })
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
                  trackingHandler(TRACKING_EVENT_TYPE.MENU_LINK_CLICKED, {
                    item_label: 'Privacy Policy',
                    item_url: TERM_FILES_PATH.PRIVACY_POLICY,
                    is_external: true,
                  })
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
                <Row className="justify-end">
                  <span className="text-text">
                    <Trans>View</Trans>
                  </span>
                  &nbsp;
                  <LightIcon className="text-text" />
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
                trackingHandler(TRACKING_EVENT_TYPE.NOTIFICATION_CLICK_MENU)
                trackingHandler(TRACKING_EVENT_TYPE.NOTIFICATION_CENTER_OPENED, {
                  source: 'menu_dropdown',
                })
                handlePreferenceClickMixpanel('Notifications')
                toggle()
              }}
            >
              <Trans>Notification Center</Trans>
              <MailIcon size={17} className="text-text" />
            </NavLinkBetween>
            <NavLinkBetween
              onClick={() => {
                setIsSelectingLanguage(true)
                handlePreferenceClickMixpanel('Language')
              }}
            >
              <Trans>Language</Trans>
              <ButtonEmpty padding="0" width="fit-content" className="text-sm text-text no-underline">
                {getLocaleLabel(userLocale, true)}&nbsp;&nbsp;
                <ArrowRight className="text-text" />
              </ButtonEmpty>
            </NavLinkBetween>

            <Divider />

            <AutoRow className="justify-center">
              <ButtonPrimary
                disabled={!account || !networkInfo.classic.claimReward || pendingTx}
                onClick={() => {
                  trackingHandler(TRACKING_EVENT_TYPE.CLAIM_REWARDS_INITIATED)
                  toggleClaimPopup()
                }}
                className={cn('mt-2.5 w-max p-[11px] text-sm', !isMobile && 'mx-auto')}
              >
                {pendingTx ? (
                  <>
                    <Loader className="mr-[5px] text-disableText" /> <Trans>Claiming...</Trans>
                  </>
                ) : (
                  <Trans>Claim Rewards</Trans>
                )}
              </ButtonPrimary>
            </AutoRow>

            <span className="mt-4 block text-center text-[10px] font-light text-subText">kyberswap@{TAG}</span>
            <div
              className={cn(
                'sticky z-[2] w-full text-center [animation:floating_1s_ease_infinite_alternate-reverse]',
                showScroll ? 'visible' : 'invisible',
              )}
            >
              <ChevronDown className="text-text4" />
            </div>
          </div>
        )}
      </MenuFlyout>

      <ClaimRewardModal />
      {FAUCET_NETWORKS.includes(chainId) && <FaucetModal />}
      <TipLinkGeneratorModal isOpen={showTipLinkGenerator} onDismiss={closeTipLinkGenerator} />
    </div>
  )
}
