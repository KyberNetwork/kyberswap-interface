import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import Column from 'components/Column'
import { APP_PATHS } from 'constants/index'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'
import { NewLabel } from 'components/Menu'
import { Flex } from 'rebass'

const StyledNavGroup = styled(NavGroup)`
  ${({ theme }) => theme.mediaWidth.upToXXSmall`
      display: none;
  `}
`

const StyledNavGroupPad = styled(NavGroup)`
  ${({ theme }) => theme.mediaWidth.upToXXSmall`
      display: none;
  `}
  margin-left: 4px;
`

const ELabel = styled.span`
  font-size: 10px;
  margin-left: 4px;
`

const CampaignNavGroup = () => {
  const { pathname } = useLocation()
  const isActiveMayTrading = pathname.includes('/campaigns/may-trading')
  const isActive = pathname.includes('/campaigns') && !isActiveMayTrading
  const upTo500 = useMedia('(max-width: 500px)')

  // if (upTo500) return null

  return (
    <>
      <StyledNavGroup
        dropdownAlign={upTo500 ? 'right' : 'left'}
        isActive={isActiveMayTrading}
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

            <StyledNavGroupPad
              dropdownAlign={upTo500 ? 'right' : 'left'}
              isActive={isActive}
              anchor={
                <DropdownTextAnchor style={{ position: 'relative', width: 'max-content' }}>
                  <Flex>
                    Arbitrum STIP
                    <ELabel>ENDED</ELabel>
                  </Flex>
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
          </Column>
        }
      />
    </>
  )
}

export default CampaignNavGroup
