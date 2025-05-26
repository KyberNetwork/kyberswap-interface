import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import styled, { useTheme } from 'styled-components'

import Column from 'components/Column'
import { APP_PATHS } from 'constants/index'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'
import { NewLabel } from 'components/Menu'
import { Flex } from 'rebass'

const StyledNavGroup = styled(NavGroup)`
  ${({ theme }) => theme.mediaWidth.upToXXSmall`
      // display: none;
  `}
`

const ELabel = styled.span`
  font-size: 10px;
  margin-left: 4px;
`

const NestedNavLink = styled(StyledNavLink)`
  font-size: 14px;
  gap: 12px;
`

const CampaignNavGroup = () => {
  const { pathname } = useLocation()
  const isActiveMayTrading = pathname.includes('/campaigns/may-trading')
  const isActive = pathname.includes('/campaigns') && !isActiveMayTrading
  const upTo420 = useMedia('(max-width: 420px)')
  const upTo500 = useMedia('(max-width: 500px)')
  const theme = useTheme()

  if (upTo420) return null

  return (
    <>
      <StyledNavGroup
        dropdownAlign={upTo500 ? 'right' : 'left'}
        isActive={isActive}
        anchor={
          <DropdownTextAnchor style={{ position: 'relative', width: 'max-content' }}>
            <Flex>
              Campaigns
              <NewLabel>New</NewLabel>
            </Flex>
          </DropdownTextAnchor>
        }
        dropdownContent={
          <Column>
            <StyledNavLink to={APP_PATHS.MAY_TRADING_CAMPAIGN}>
              <Trans>May Trading</Trans>
              <NewLabel>New</NewLabel>
            </StyledNavLink>

            <StyledNavLink to={APP_PATHS.AGGREGATOR_CAMPAIGN} style={{ textDecoration: 'none', color: theme.subText }}>
              Arbitrum STIP
              <ELabel>ENDED</ELabel>
            </StyledNavLink>

            <Column
              sx={{
                padding: '0px 8px',
              }}
            >
              <NestedNavLink to={APP_PATHS.AGGREGATOR_CAMPAIGN}>
                <Trans>Aggregator Trading</Trans>
              </NestedNavLink>
              <NestedNavLink to={APP_PATHS.LIMIT_ORDER_CAMPAIGN}>
                <Trans>Limit Order</Trans>
              </NestedNavLink>
              <NestedNavLink to={APP_PATHS.REFFERAL_CAMPAIGN}>
                <Trans>Referral</Trans>
              </NestedNavLink>
            </Column>
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
