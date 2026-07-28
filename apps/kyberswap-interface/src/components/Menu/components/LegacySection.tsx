import { Trans } from '@lingui/macro'
import { AlertOctagon } from 'react-feather'
import { NavLink } from 'react-router-dom'

import Icon from 'components/Icons/Icon'
import { MenuItem, MenuItemLink, MenuSection, Title } from 'components/Menu/MenuItems'
import { LEGACY_POOL_APP_PATHS } from 'constants/legacyPools'

type LegacySectionProps = {
  toggle?: () => void
}

export const LegacySection = ({ toggle }: LegacySectionProps) => (
  <MenuSection>
    <Title>
      <Trans>Legacy</Trans>
    </Title>

    <MenuItem>
      <MenuItemLink>
        <NavLink to={LEGACY_POOL_APP_PATHS.ELASTIC_SNAPSHOT} onClick={toggle}>
          <AlertOctagon size={14} />
          <Trans>Treasury Grant 2023</Trans>
        </NavLink>
      </MenuItemLink>
    </MenuItem>

    <MenuItem>
      <MenuItemLink>
        <NavLink to={LEGACY_POOL_APP_PATHS.MY_POOLS} onClick={toggle}>
          <Icon id="liquid-outline" size={16} />
          <Trans>My Pools</Trans>
        </NavLink>
      </MenuItemLink>
    </MenuItem>
  </MenuSection>
)
