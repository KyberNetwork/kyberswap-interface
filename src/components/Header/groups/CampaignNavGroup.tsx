import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'

import Column from 'components/Column'
import { APP_PATHS } from 'constants/index'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const CampaignNavGroup = () => {
  const { pathname } = useLocation()
  const isActive = pathname.includes('/campaigns')
  const upTo500 = useMedia('(max-width: 500px)')

  if (upTo500) return null

  return (
    <>
      <NavGroup
        dropdownAlign={'left'}
        isActive={isActive}
        anchor={
          <DropdownTextAnchor>
            <Trans>Campaign</Trans>
          </DropdownTextAnchor>
        }
        dropdownContent={
          <Column>
            <StyledNavLink to={APP_PATHS.AGGREGATOR_CAMPAIGN} style={{ gap: '12px' }}>
              <Trans>Aggregator Trading</Trans>
            </StyledNavLink>
            <StyledNavLink to={APP_PATHS.LIMIT_ORDER_CAMPAIGN} style={{ gap: '12px' }}>
              <Trans>Limit Order</Trans>
            </StyledNavLink>
            <StyledNavLink to={APP_PATHS.REFFERAL_CAMPAIGN} style={{ gap: '12px' }}>
              <Trans>Referral</Trans>
            </StyledNavLink>
            <StyledNavLink to={APP_PATHS.MY_DASHBOARD} style={{ gap: '12px' }}>
              <Trans>My Dashboard</Trans>
            </StyledNavLink>
          </Column>
        }
      />
    </>
  )
}

export default CampaignNavGroup
