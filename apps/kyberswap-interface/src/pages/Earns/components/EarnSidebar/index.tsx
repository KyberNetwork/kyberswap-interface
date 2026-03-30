import { t } from '@lingui/macro'
import { useLocation, useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ReactComponent as OverviewIcon } from 'assets/svg/earn/ic_earn_overview.svg'
import { ReactComponent as PoolsIcon } from 'assets/svg/earn/ic_earn_pools.svg'
import { ReactComponent as PositionsIcon } from 'assets/svg/earn/ic_earn_positions.svg'
import { ReactComponent as FeaturedVaultIcon } from 'assets/svg/earn/ic_featured_vault.svg'
import { ReactComponent as SmartExitIcon } from 'assets/svg/earn/ic_list_smart_exit.svg'
import { ReactComponent as VaultIcon } from 'assets/svg/earn/ic_partner_vault.svg'
import { APP_PATHS } from 'constants/index'
import {
  MobileNavContainer,
  MobileNavDivider,
  MobileNavItem,
  SidebarContainer,
  SidebarGroupLabel,
  SidebarItem,
  SidebarSubItem,
  SubItemLine,
} from 'pages/Earns/components/EarnSidebar/styles'

const EarnSidebar = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (path: string) => pathname === path

  return (
    <SidebarContainer>
      <SidebarItem $active={isActive(APP_PATHS.EARN)} onClick={() => navigate(APP_PATHS.EARN)}>
        <OverviewIcon width={16} height={16} color="currentColor" />
        <Text>{t`Overview`}</Text>
      </SidebarItem>

      <Flex flexDirection="column" style={{ gap: '8px' }}>
        <SidebarGroupLabel>{t`Liquidity Pools`}</SidebarGroupLabel>

        <Flex flexDirection="column" style={{ gap: '8px' }}>
          <SidebarSubItem $active={isActive(APP_PATHS.EARN_POOLS)} onClick={() => navigate(APP_PATHS.EARN_POOLS)}>
            <SubItemLine />
            <Flex alignItems="center" style={{ gap: '4px' }}>
              <PoolsIcon width={16} height={16} color="currentColor" />
              <Text>{t`Explore Pools`}</Text>
            </Flex>
          </SidebarSubItem>

          <SidebarSubItem
            $active={isActive(APP_PATHS.EARN_POSITIONS)}
            onClick={() => navigate(APP_PATHS.EARN_POSITIONS)}
          >
            <SubItemLine />
            <Flex alignItems="center" style={{ gap: '4px' }}>
              <PositionsIcon width={16} height={16} color="currentColor" />
              <Text>{t`My Positions`}</Text>
            </Flex>
          </SidebarSubItem>

          <SidebarSubItem
            $active={isActive(APP_PATHS.EARN_SMART_EXIT)}
            onClick={() => navigate(APP_PATHS.EARN_SMART_EXIT)}
          >
            <SubItemLine />
            <Flex alignItems="center" style={{ gap: '4px' }}>
              <SmartExitIcon width={16} height={16} color="currentColor" />
              <Text>{t`Smart Exit Orders`}</Text>
            </Flex>
          </SidebarSubItem>
        </Flex>
      </Flex>

      <Flex flexDirection="column" style={{ gap: '8px' }}>
        <SidebarGroupLabel>{t`Partner Vaults`}</SidebarGroupLabel>

        <Flex flexDirection="column" style={{ gap: '8px' }}>
          <SidebarSubItem $active={isActive(APP_PATHS.EARN_VAULTS)} onClick={() => navigate(APP_PATHS.EARN_VAULTS)}>
            <SubItemLine />
            <Flex alignItems="center" style={{ gap: '4px' }}>
              <VaultIcon width={16} height={16} color="currentColor" />
              <Text>{t`Explore Vaults`}</Text>
            </Flex>
          </SidebarSubItem>

          <SidebarSubItem
            $active={isActive(APP_PATHS.EARN_MY_VAULTS)}
            onClick={() => navigate(APP_PATHS.EARN_MY_VAULTS)}
          >
            <SubItemLine />
            <Flex alignItems="center" style={{ gap: '4px' }}>
              <FeaturedVaultIcon width={16} height={16} color="currentColor" />
              <Text>{t`My Vaults`}</Text>
            </Flex>
          </SidebarSubItem>
        </Flex>
      </Flex>
    </SidebarContainer>
  )
}

export const EarnMobileNav = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (path: string) => pathname === path

  return (
    <MobileNavContainer>
      <MobileNavItem $active={isActive(APP_PATHS.EARN)} onClick={() => navigate(APP_PATHS.EARN)}>
        {t`Overview`}
      </MobileNavItem>
      <MobileNavDivider />
      <MobileNavItem $active={isActive(APP_PATHS.EARN_POOLS)} onClick={() => navigate(APP_PATHS.EARN_POOLS)}>
        {t`Explore Pools`}
      </MobileNavItem>
      <MobileNavItem $active={isActive(APP_PATHS.EARN_POSITIONS)} onClick={() => navigate(APP_PATHS.EARN_POSITIONS)}>
        {t`My Positions`}
      </MobileNavItem>
      <MobileNavItem $active={isActive(APP_PATHS.EARN_SMART_EXIT)} onClick={() => navigate(APP_PATHS.EARN_SMART_EXIT)}>
        {t`Smart Exit Orders`}
      </MobileNavItem>
      <MobileNavDivider />
      <MobileNavItem $active={isActive(APP_PATHS.EARN_VAULTS)} onClick={() => navigate(APP_PATHS.EARN_VAULTS)}>
        {t`Explore Vaults`}
      </MobileNavItem>
      <MobileNavItem $active={isActive(APP_PATHS.EARN_MY_VAULTS)} onClick={() => navigate(APP_PATHS.EARN_MY_VAULTS)}>
        {t`My Vaults`}
      </MobileNavItem>
    </MobileNavContainer>
  )
}

export default EarnSidebar
