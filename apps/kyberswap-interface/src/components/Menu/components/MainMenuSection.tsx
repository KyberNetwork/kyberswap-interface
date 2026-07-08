import { Trans, t } from '@lingui/macro'
import { BookOpen, FileText, Info, MessageCircle, PieChart, Users } from 'react-feather'
import { NavLink } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ReactComponent as BlogIcon } from 'assets/svg/blog.svg'
import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { ReactComponent as TipLinkIcon } from 'assets/svg/earn/ic_tip_link.svg'
import { ReactComponent as RoadMapIcon } from 'assets/svg/roadmap.svg'
import CampaignIcon from 'components/Icons/CampaignIcon'
import Faucet from 'components/Icons/Faucet'
import VoteIcon from 'components/Icons/Vote'
import { MenuItem, MenuItemContent, MenuItemLink, MenuSection, Title } from 'components/Menu/MenuItems'
import NavDropDown from 'components/Menu/NavDropDown'
import { AGGREGATOR_ANALYTICS_URL, APP_PATHS, TERM_FILES_PATH } from 'constants/index'
import { FAUCET_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

type MainMenuSectionProps = {
  openTipLinkGenerator?: () => void
  toggle?: () => void
}

export const MainMenuSection = ({ openTipLinkGenerator, toggle }: MainMenuSectionProps) => {
  const { chainId, networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const toggleFaucetPopup = useToggleModal(ApplicationModal.FAUCET_POPUP)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const bridgeLink = networkInfo.bridgeURL

  const handleMenuClickMixpanel = (name: string) => {
    trackingHandler(TRACKING_EVENT_TYPE.MENU_MENU_CLICK, { menu: name })
  }

  return (
    <MenuSection>
      <Title>
        <Trans>Menu</Trans>
      </Title>
      <MenuItem>
        <MenuItemContent
          onClick={() => {
            openTipLinkGenerator?.()
            handleMenuClickMixpanel('Tip Link Generator')
            toggle?.()
          }}
        >
          <TipLinkIcon />
          <span>
            <Trans>Tip Link Generator</Trans>
          </span>
        </MenuItemContent>
      </MenuItem>
      {FAUCET_NETWORKS.includes(chainId) && (
        <MenuItem>
          <MenuItemContent
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
          </MenuItemContent>
        </MenuItem>
      )}
      {upToExtraSmall && (
        <>
          <MenuItem>
            <MenuItemLink>
              <NavLink to={APP_PATHS.COPY_TRADING} onClick={toggle}>
                <Users />
                <span className="w-max">
                  <Trans>Copy Trading</Trans>
                </span>
              </NavLink>
            </MenuItemLink>
          </MenuItem>
          <MenuItem>
            <MenuItemLink>
              <NavLink to={APP_PATHS.MARKET_OVERVIEW}>
                <PieChart />
                <span>
                  <Trans>Market</Trans>
                </span>
              </NavLink>
            </MenuItemLink>
          </MenuItem>
        </>
      )}

      {upToMedium && (
        <MenuItem>
          <NavDropDown
            icon={<VoteIcon />}
            title={<Trans>KyberDAO</Trans>}
            options={[
              { link: APP_PATHS.KYBERDAO_STAKE, label: t`Stake KNC` },
              { link: APP_PATHS.KYBERDAO_VOTE, label: t`Vote` },
              { link: APP_PATHS.KYBERDAO_KNC_UTILITY, label: t`KNC Utility` },
            ]}
          />
        </MenuItem>
      )}

      {upToXXSmall && (
        <MenuItem>
          <NavDropDown
            icon={<CampaignIcon />}
            title={<Trans>Campaigns</Trans>}
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
          <MenuItemLink>
            <ExternalLink href={bridgeLink}>
              <BridgeIcon />
              <Trans>Bridge Assets</Trans>
            </ExternalLink>
          </MenuItemLink>
        </MenuItem>
      )}

      {upToMedium && (
        <>
          <MenuItem>
            <MenuItemLink>
              <ExternalLink href={AGGREGATOR_ANALYTICS_URL}>
                <PieChart />
                <Trans>Analytics</Trans>
              </ExternalLink>
            </MenuItemLink>
          </MenuItem>

          <MenuItem>
            <NavDropDown
              icon={<Info />}
              title={t`About`}
              options={[
                { link: '/about/kyberswap', label: 'KyberSwap' },
                { link: '/about/knc', label: 'KNC' },
              ]}
            />
          </MenuItem>
        </>
      )}

      <MenuItem>
        <MenuItemLink>
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
        </MenuItemLink>
      </MenuItem>

      <MenuItem>
        <MenuItemLink>
          <ExternalLink
            href="https://kyberswap.canny.io/"
            onClick={() => {
              toggle?.()
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
        </MenuItemLink>
      </MenuItem>

      <MenuItem>
        <MenuItemLink>
          <ExternalLink
            href="https://gov.kyber.org"
            onClick={() => {
              toggle?.()
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
        </MenuItemLink>
      </MenuItem>

      {upToExtraSmall && (
        <MenuItem>
          <MenuItemLink>
            <ExternalLink href="https://blog.kyberswap.com">
              <BlogIcon />
              <Trans>Blog</Trans>
            </ExternalLink>
          </MenuItemLink>
        </MenuItem>
      )}

      <MenuItem>
        <MenuItemLink>
          <ExternalLink
            href={TERM_FILES_PATH.KYBERSWAP_TERMS}
            onClick={() => {
              toggle?.()
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
        </MenuItemLink>
      </MenuItem>
      <MenuItem>
        <MenuItemLink>
          <ExternalLink
            href={TERM_FILES_PATH.PRIVACY_POLICY}
            onClick={() => {
              toggle?.()
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
        </MenuItemLink>
      </MenuItem>
    </MenuSection>
  )
}
