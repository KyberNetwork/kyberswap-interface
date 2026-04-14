import { t } from '@lingui/macro'
import { ComponentType, Fragment, SVGProps, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ReactComponent as PoolsIcon } from 'assets/svg/earn/ic_earn_pools.svg'
import { ReactComponent as PositionsIcon } from 'assets/svg/earn/ic_earn_positions.svg'
import { ReactComponent as FeaturedVaultIcon } from 'assets/svg/earn/ic_featured_vault.svg'
import { ReactComponent as SmartExitIcon } from 'assets/svg/earn/ic_list_smart_exit.svg'
import { ReactComponent as VaultIcon } from 'assets/svg/earn/ic_partner_vault.svg'
import { APP_PATHS } from 'constants/index'
import {
  BreadcrumbsContainer,
  BreadcrumbsItem,
  BreadcrumbsSeparator,
  BreadcrumbsToggleButton,
  BreadcrumbsTrail,
  CollapseToggleButton,
  GroupDivider,
  SidebarContainer,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarHeaderLabel,
  SidebarNavItem,
} from 'pages/Earns/components/EarnSidebar/styles'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

type NavItem = {
  label: string
  path: string
  icon: IconComponent
  matchPath?: (pathname: string) => boolean
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const useEarnNavGroups = (): NavGroup[] =>
  useMemo(
    () => [
      {
        label: t`Liquidity Pools`,
        items: [
          { label: t`Explore Pools`, path: APP_PATHS.EARN_POOLS, icon: PoolsIcon },
          {
            label: t`My Positions`,
            path: APP_PATHS.EARN_POSITIONS,
            icon: PositionsIcon,
            matchPath: p => p === APP_PATHS.EARN_POSITIONS || p.startsWith('/earn/position/'),
          },
          { label: t`Smart Exit Orders`, path: APP_PATHS.EARN_SMART_EXIT, icon: SmartExitIcon },
        ],
      },
      {
        label: t`Partner Vaults`,
        items: [
          { label: t`Explore Vaults`, path: APP_PATHS.EARN_VAULTS, icon: VaultIcon },
          { label: t`My Vaults`, path: APP_PATHS.EARN_MY_VAULTS, icon: FeaturedVaultIcon },
        ],
      },
    ],
    [],
  )

const isItemMatch = (item: NavItem, pathname: string) =>
  item.matchPath ? item.matchPath(pathname) : pathname === item.path

const SidebarToggleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="3.5" x2="8" y2="16.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

interface EarnSidebarProps {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
  inDrawer?: boolean
}

const EarnSidebar = ({ collapsed, onToggle, onNavigate, inDrawer }: EarnSidebarProps) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const groups = useEarnNavGroups()

  const handleNavigate = (path: string) => {
    navigate(path)
    onNavigate?.()
  }

  const isOverviewActive = pathname === APP_PATHS.EARN

  return (
    <SidebarContainer as="nav" $collapsed={collapsed} $inDrawer={inDrawer} aria-label={t`Earn navigation`}>
      <SidebarHeader $collapsed={collapsed} $active={!collapsed && isOverviewActive}>
        {!collapsed && (
          <SidebarHeaderLabel
            type="button"
            $active={isOverviewActive}
            aria-current={isOverviewActive ? 'page' : undefined}
            onClick={() => handleNavigate(APP_PATHS.EARN)}
          >
            {t`Overview`}
          </SidebarHeaderLabel>
        )}
        <CollapseToggleButton type="button" onClick={onToggle} aria-label={t`Toggle sidebar`}>
          <SidebarToggleIcon />
        </CollapseToggleButton>
      </SidebarHeader>

      {groups.map((group, idx) => {
        const isGroupActive = group.items.some(item => isItemMatch(item, pathname))
        return (
          <Fragment key={group.label}>
            {collapsed && idx > 0 && <GroupDivider />}
            <SidebarGroup>
              {!collapsed && <SidebarGroupLabel $active={isGroupActive}>{group.label}</SidebarGroupLabel>}
              {group.items.map(item => {
                const Icon = item.icon
                const active = isItemMatch(item, pathname)
                return (
                  <SidebarNavItem
                    key={item.path}
                    type="button"
                    $active={active}
                    $collapsed={collapsed}
                    aria-current={active ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    onClick={() => handleNavigate(item.path)}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon width={18} height={18} color="currentColor" />
                    {!collapsed && <span>{item.label}</span>}
                  </SidebarNavItem>
                )
              })}
            </SidebarGroup>
          </Fragment>
        )
      })}
    </SidebarContainer>
  )
}

interface EarnBreadcrumbsProps {
  onOpenDrawer: () => void
}

export const EarnBreadcrumbs = ({ onOpenDrawer }: EarnBreadcrumbsProps) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const groups = useEarnNavGroups()

  const trail = useMemo(() => {
    const earnRoot = { label: t`Earn`, path: APP_PATHS.EARN as string | undefined }

    if (pathname === APP_PATHS.EARN) {
      return [{ ...earnRoot, path: undefined }]
    }

    for (const group of groups) {
      for (const item of group.items) {
        if (isItemMatch(item, pathname)) {
          return [earnRoot, { label: group.label, path: undefined }, { label: item.label, path: undefined }]
        }
      }
    }

    return [{ ...earnRoot, path: undefined }]
  }, [pathname, groups])

  return (
    <BreadcrumbsContainer as="nav" aria-label={t`Earn breadcrumbs`}>
      <BreadcrumbsToggleButton type="button" onClick={onOpenDrawer} aria-label={t`Open Earn menu`}>
        <SidebarToggleIcon />
      </BreadcrumbsToggleButton>
      <BreadcrumbsTrail>
        {trail.map((item, idx) => {
          const isCurrent = idx === trail.length - 1
          const clickable = !isCurrent && !!item.path
          return (
            <Fragment key={`${item.label}-${idx}`}>
              {idx > 0 && <BreadcrumbsSeparator aria-hidden="true">{'›'}</BreadcrumbsSeparator>}
              <BreadcrumbsItem
                as={clickable ? 'button' : 'span'}
                type={clickable ? 'button' : undefined}
                $current={isCurrent}
                $clickable={clickable}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={clickable && item.path ? () => navigate(item.path as string) : undefined}
              >
                {item.label}
              </BreadcrumbsItem>
            </Fragment>
          )
        })}
      </BreadcrumbsTrail>
    </BreadcrumbsContainer>
  )
}

export default EarnSidebar
