import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import {
  Award,
  BookOpen,
  Edit,
  FileText,
  Info,
  MessageCircle,
  PieChart,
  Share2,
  Triangle,
  UserPlus,
} from 'react-feather'
import { NavLink } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as BlogIcon } from 'assets/svg/blog.svg'
import { ReactComponent as LightIcon } from 'assets/svg/light.svg'
import { ReactComponent as RoadMapIcon } from 'assets/svg/roadmap.svg'
import { SlideToUnlock } from 'components/Header'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import Faucet from 'components/Icons/Faucet'
import { AGGREGATOR_ANALYTICS_URL, DMM_ANALYTICS_URL } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'

import NavDropDown from './NavDropDown'

const sharedStylesMenuItem = css`
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 0;

  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
  color: ${({ theme }) => theme.subText};

  :hover {
    color: ${({ theme }) => theme.text};
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

const StyledLightIcon = styled(LightIcon)`
  path {
    stroke: ${({ theme }) => theme.subText};
  }
`

export const NavMenuItem = styled(NavLink)`
  ${sharedStylesMenuItem}
`

export const ExternalNavMenuItem = styled(ExternalLink)`
  ${sharedStylesMenuItem}
`

const MenuButton = styled.div`
  ${sharedStylesMenuItem}
`

const MenuItems: React.FC = () => {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const toggle = useToggleModal(ApplicationModal.MENU)

  const under1440 = useMedia('(max-width: 1440px)')
  const above1321 = useMedia('(min-width: 1321px)')
  const above768 = useMedia('(min-width: 768px)')
  const under369 = useMedia('(max-width: 370px)')

  const getBridgeLink = () => {
    if (!chainId) return ''
    return NETWORKS_INFO[chainId].bridgeURL
  }

  const bridgeLink = getBridgeLink()
  const toggleFaucetPopup = useToggleModal(ApplicationModal.FAUCET_POPUP)
  const { mixpanelHandler } = useMixpanel()
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <Text fontWeight={500} fontSize={16} color={theme.text}>
        {t`Menu`}
      </Text>

      {chainId && [ChainId.BTTC, ChainId.RINKEBY].includes(chainId) && (
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

      {!above768 && (
        <NavMenuItem to={'/discover?tab=trending_soon'} onClick={toggle}>
          <DiscoverIcon size={14} />
          <SlideToUnlock>
            <Text width="max-content">
              <Trans>Discover</Trans>
            </Text>
          </SlideToUnlock>
        </NavMenuItem>
      )}

      {under369 && (
        <NavMenuItem to="/campaigns" onClick={toggle}>
          <Award size={14} />
          <Trans>Campaigns</Trans>
        </NavMenuItem>
      )}
      {under1440 && (
        <NavDropDown
          icon={<Info size={14} />}
          title={'About'}
          link={'/about'}
          options={[
            { link: '/about/kyberswap', label: 'KyberSwap' },
            { link: '/about/knc', label: 'KNC' },
          ]}
        />
      )}

      <NavMenuItem to="/referral" onClick={toggle}>
        <UserPlus size={14} />
        <Trans>Referral</Trans>
      </NavMenuItem>

      {!above1321 && (
        <NavDropDown
          icon={<PieChart size={14} />}
          link="#"
          title={'Analytics'}
          options={[
            { link: DMM_ANALYTICS_URL[chainId as ChainId], label: 'Liquidity', external: true },
            {
              link: AGGREGATOR_ANALYTICS_URL,
              label: 'Aggregator',
              external: true,
            },
          ]}
        />
      )}
      <ExternalNavMenuItem href="https://docs.kyberswap.com">
        <BookOpen size={14} />
        <Trans>Docs</Trans>
      </ExternalNavMenuItem>

      <ExternalNavMenuItem href="https://request.kyberswap.com" onClick={toggle}>
        <StyledLightIcon width="14px" height="14px" />
        <Trans>Feature Request</Trans>
      </ExternalNavMenuItem>

      <ExternalNavMenuItem href="https://request.kyberswap.com/roadmap" onClick={toggle}>
        <StyledRoadMapIcon width="14px" height="14px" />
        <Trans>Roadmap</Trans>
      </ExternalNavMenuItem>

      <ExternalNavMenuItem href="https://gov.kyber.org">
        <MessageCircle size={14} />
        <Trans>Forum</Trans>
      </ExternalNavMenuItem>

      {under1440 && (
        <ExternalNavMenuItem href="https://blog.kyberswap.com">
          <StyledBlogIcon width="14px" height="14px" />
          <Trans>Blog</Trans>
        </ExternalNavMenuItem>
      )}

      <ExternalNavMenuItem href="/15022022KyberSwapTermsofUse.pdf">
        <FileText size={14} />
        <Trans>Terms</Trans>
      </ExternalNavMenuItem>
      {process.env.REACT_APP_MAINNET_ENV !== 'production' && (
        <NavMenuItem to="/swap-legacy" onClick={toggle}>
          <Triangle size={14} />
          <Trans>Swap Legacy</Trans>
        </NavMenuItem>
      )}

      <ExternalNavMenuItem href="https://forms.gle/gLiNsi7iUzHws2BY8">
        <Edit size={14} />
        <Trans>Contact Us</Trans>
      </ExternalNavMenuItem>
    </Flex>
  )
}

export default MenuItems
