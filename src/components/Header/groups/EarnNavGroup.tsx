import { Trans } from '@lingui/macro'
import { AlertOctagon } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'

import { MoneyBag } from 'components/Icons'
import Icon from 'components/Icons/Icon'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const EarnNavGroup = () => {
  const { networkInfo } = useActiveWeb3React()
  const upTo420 = useMedia('(max-width: 420px)')
  const { pathname } = useLocation()
  const { mixpanelHandler } = useMixpanel()
  const isActive = [APP_PATHS.POOLS, APP_PATHS.FARMS, APP_PATHS.MY_POOLS].some(path => pathname.includes(path))

  return (
    <NavGroup
      dropdownAlign={upTo420 ? 'right' : 'left'}
      id={TutorialIds.EARNING_LINKS}
      isActive={isActive}
      anchor={
        <DropdownTextAnchor data-testid="earn-menu">
          <Trans>Earn</Trans>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <Flex
          sx={{
            flexDirection: 'column',
          }}
        >
          <StyledNavLink
            id="pools-nav-link"
            data-testid="pools-nav-link"
            to={{ pathname: `${APP_PATHS.POOLS}/${networkInfo.route}`, search: `tab=${VERSION.CLASSIC}` }}
            style={{ width: '100%' }}
          >
            <Flex sx={{ gap: '12px' }} alignItems="center">
              <Icon id="liquid" size={16} />
              <Trans>Pools</Trans>
            </Flex>
          </StyledNavLink>

          <StyledNavLink
            onClick={() => {
              mixpanelHandler(MIXPANEL_TYPE.FARM_UNDER_EARN_TAB_CLICK)
            }}
            id="farms-nav-link"
            data-testid="farms-nav-link"
            to={{ pathname: `${APP_PATHS.FARMS}/${networkInfo.route}`, search: `tab=${VERSION.CLASSIC}` }}
          >
            <Flex sx={{ gap: '12px' }} alignItems="center">
              <MoneyBag size={16} />
              <Trans>Farms</Trans>
            </Flex>
          </StyledNavLink>

          <StyledNavLink
            id="my-pools-nav-link"
            data-testid="my-pools-nav-link"
            to={`${APP_PATHS.MY_POOLS}/${networkInfo.route}`}
          >
            <Flex sx={{ gap: '12px' }} alignItems="center">
              <Icon id="liquid-outline" size={16} />
              <Trans>My Pools</Trans>
            </Flex>
          </StyledNavLink>

          <StyledNavLink id="my-pools-nav-link" data-testid="my-pools-nav-link" to={`${APP_PATHS.ELASTIC_SNAPSHOT}`}>
            <Flex sx={{ gap: '12px' }} alignItems="center">
              <AlertOctagon size={14} />
              <Trans>Snapshot</Trans>
            </Flex>
          </StyledNavLink>
        </Flex>
      }
    />
  )
}

export default EarnNavGroup
