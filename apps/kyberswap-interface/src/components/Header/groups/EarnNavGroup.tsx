import { t } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'

import { ReactComponent as KemIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/earn/ic_claim.svg'
import { ReactComponent as OverviewIcon } from 'assets/svg/earn/ic_earn_overview.svg'
import { ReactComponent as PoolsIcon } from 'assets/svg/earn/ic_earn_pools.svg'
import { ReactComponent as PositionsIcon } from 'assets/svg/earn/ic_earn_positions.svg'
import { APP_PATHS } from 'constants/index'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'
import { FilterTag } from 'pages/Earns/PoolExplorer'

const EarnNavGroup = () => {
  const upTo420 = useMedia('(max-width: 420px)')
  const { pathname, search } = useLocation()
  const isActive = [
    APP_PATHS.EARN,
    APP_PATHS.EARN_POOLS,
    APP_PATHS.EARN_POSITIONS,
    APP_PATHS.EARN_POSITION_DETAIL,
  ].some(path => pathname.includes(path))

  return (
    <NavGroup
      dropdownAlign={upTo420 ? 'right' : 'left'}
      isActive={isActive}
      anchor={
        <DropdownTextAnchor>
          <Flex sx={{ gap: 1 }} alignItems="center">
            <KemIcon width={20} height={20} />
            {t`Earn`}
          </Flex>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <Flex
          sx={{
            flexDirection: 'column',
          }}
        >
          <StyledNavLink
            id="earn-landing-nav-link"
            data-testid="earn-landing-nav-link"
            to={{ pathname: `${APP_PATHS.EARN}` }}
            style={{ width: '100%' }}
            customActive
            isCustomActive={pathname === APP_PATHS.EARN}
          >
            <Flex sx={{ gap: '12px' }} alignItems="center">
              <OverviewIcon width={16} height={16} />
              {t`Overview`}
            </Flex>
          </StyledNavLink>

          <StyledNavLink
            id="earn-pools-explorer-nav-link"
            data-testid="earn-pools-explorer-nav-link"
            to={{ pathname: `${APP_PATHS.EARN_POOLS}` }}
            customActive
            isCustomActive={pathname === APP_PATHS.EARN_POOLS && search !== `?tag=${FilterTag.FARMING_POOL}`}
          >
            <Flex sx={{ gap: '12px' }} alignItems="center">
              <PoolsIcon width={16} height={16} />
              {t`All Pools`}
            </Flex>
          </StyledNavLink>

          <StyledNavLink
            id="earn-farming-pools-nav-link"
            data-testid="earn-farming-pools-nav-link"
            to={{ pathname: `${APP_PATHS.EARN_POOLS}`, search: `tag=${FilterTag.FARMING_POOL}` }}
            customActive
            isCustomActive={pathname === APP_PATHS.EARN_POOLS && search === `?tag=${FilterTag.FARMING_POOL}`}
          >
            <Flex sx={{ gap: '12px' }} alignItems="center">
              <FarmingIcon width={16} height={16} />
              {t`Farming Pools`}
            </Flex>
          </StyledNavLink>

          <StyledNavLink
            id="earn-positions-nav-link"
            data-testid="earn-positions-nav-link"
            to={{ pathname: `${APP_PATHS.EARN_POSITIONS}` }}
          >
            <Flex sx={{ gap: '12px' }} alignItems="center">
              <PositionsIcon width={16} height={16} />
              {t`My Positions`}
            </Flex>
          </StyledNavLink>
        </Flex>
      }
    />
  )
}

export default EarnNavGroup
