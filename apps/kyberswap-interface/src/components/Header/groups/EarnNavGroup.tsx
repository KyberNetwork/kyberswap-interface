import { t } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ReactComponent as OverviewIcon } from 'assets/svg/earn/ic_earn_overview.svg'
import { ReactComponent as PoolsIcon } from 'assets/svg/earn/ic_earn_pools.svg'
import { ReactComponent as PositionsIcon } from 'assets/svg/earn/ic_earn_positions.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/earn/ic_farming.svg'
import { ReactComponent as ListSmartExitIcon } from 'assets/svg/earn/ic_list_smart_exit.svg'
import { ReactComponent as KemIcon } from 'assets/svg/kyber/kem.svg'
import NavGroup from 'components/Header/groups/NavGroup'
import { DropdownTextAnchor, NewLabel, StyledNavLink } from 'components/Header/styleds'
import { APP_PATHS } from 'constants/index'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import { MEDIA_WIDTHS } from 'theme'

const EarnNavGroup = () => {
  const upTo430 = useMedia('(max-width: 430px)')
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { pathname, search } = useLocation()
  const isActive = [
    APP_PATHS.EARN,
    APP_PATHS.EARN_POOLS,
    APP_PATHS.EARN_POSITIONS,
    APP_PATHS.EARN_POSITION_DETAIL,
    APP_PATHS.EARN_SMART_EXIT,
  ].some(path => pathname.includes(path))

  return (
    <NavGroup
      dropdownAlign={upTo430 ? 'right' : 'left'}
      isActive={isActive}
      anchor={
        <DropdownTextAnchor>
          <div className="flex items-center gap-1">
            <KemIcon width={20} height={20} />
            {upToSmall ? (
              t`Earn`
            ) : (
              <StyledNavLink to={{ pathname: `${APP_PATHS.EARN}` }} style={{ padding: 0 }}>{t`Earn`}</StyledNavLink>
            )}
          </div>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <div className="flex flex-col">
          <StyledNavLink
            id="earn-landing-nav-link"
            data-testid="earn-landing-nav-link"
            to={{ pathname: `${APP_PATHS.EARN}` }}
            style={{ width: '100%' }}
            customActive
            isCustomActive={pathname === APP_PATHS.EARN}
          >
            <div className="flex items-center gap-3">
              <OverviewIcon width={16} height={16} />
              {t`Overview`}
            </div>
          </StyledNavLink>

          <StyledNavLink
            id="earn-pools-explorer-nav-link"
            data-testid="earn-pools-explorer-nav-link"
            to={{ pathname: `${APP_PATHS.EARN_POOLS}` }}
            customActive
            isCustomActive={pathname === APP_PATHS.EARN_POOLS && !search.includes(`tag=${FilterTag.FARMING_POOL}`)}
          >
            <div className="flex items-center gap-3">
              <PoolsIcon width={16} height={16} />
              {t`All Pools`}
            </div>
          </StyledNavLink>

          <StyledNavLink
            id="earn-farming-pools-nav-link"
            data-testid="earn-farming-pools-nav-link"
            to={{ pathname: `${APP_PATHS.EARN_POOLS}`, search: `tag=${FilterTag.FARMING_POOL}` }}
            customActive
            isCustomActive={pathname === APP_PATHS.EARN_POOLS && search.includes(`tag=${FilterTag.FARMING_POOL}`)}
          >
            <div className="flex items-center gap-3">
              <FarmingIcon width={16} height={16} />
              <div className="flex gap-0.5">{t`Farming Pools`}</div>
            </div>
          </StyledNavLink>

          <StyledNavLink
            id="earn-positions-nav-link"
            data-testid="earn-positions-nav-link"
            to={{ pathname: `${APP_PATHS.EARN_POSITIONS}` }}
          >
            <div className="flex items-center gap-3">
              <PositionsIcon width={16} height={16} />
              {t`My Positions`}
            </div>
          </StyledNavLink>
          <StyledNavLink data-testid="earn-positions-nav-link" to={{ pathname: `${APP_PATHS.EARN_SMART_EXIT}` }}>
            <div className="flex items-center gap-3">
              <ListSmartExitIcon width={16} height={16} />
              <div className="flex">
                {t`Smart Exit Orders`}
                <NewLabel>Beta</NewLabel>
              </div>
            </div>
          </StyledNavLink>
        </div>
      }
    />
  )
}

export default EarnNavGroup
