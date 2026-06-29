import { Trans } from '@lingui/macro'
import { AlertOctagon } from 'react-feather'
import { NavLink } from 'react-router-dom'

import Icon from 'components/Icons/Icon'
import { MenuItem, MenuSection, Title } from 'components/Menu/MenuItems'
import { APP_PATHS } from 'constants/index'

type LegacySectionProps = {
  toggle?: () => void
}

export const LegacySection = ({ toggle }: LegacySectionProps) => (
  <MenuSection>
    <Title>
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
  </MenuSection>
)
