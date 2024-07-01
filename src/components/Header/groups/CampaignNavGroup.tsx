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
  const upTo600 = useMedia('(max-width: 600px)')

  return (
    <>
      <NavGroup
        dropdownAlign={upTo600 ? 'right' : 'left'}
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
              <Trans>LimitOrder</Trans>
            </StyledNavLink>
          </Column>
        }
      />
    </>
  )
}

export default CampaignNavGroup
