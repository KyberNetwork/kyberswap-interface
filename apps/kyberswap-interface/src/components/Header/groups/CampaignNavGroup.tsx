import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import styled, { useTheme } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import Column from 'components/Column'
// import { NewLabel } from 'components/Menu'
import { APP_PATHS } from 'constants/index'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const DropdownIcon = styled(DropdownSVG)<{ open: boolean }>`
  transform: ${({ open }) => (open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.3s;
`

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

  const [showStip, setShowStip] = useState(false)

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
              {/*<NewLabel>New</NewLabel>*/}
            </Flex>
          </DropdownTextAnchor>
        }
        dropdownContent={
          <Column>
            <StyledNavLink to={APP_PATHS.MAY_TRADING_CAMPAIGN}>
              <Trans>May Trading</Trans>
              <ELabel>ENDED</ELabel>
            </StyledNavLink>

            <StyledNavLink
              to={APP_PATHS.AGGREGATOR_CAMPAIGN}
              style={{ textDecoration: 'none', color: theme.subText, paddingRight: '0', paddingBottom: '0' }}
              onClick={e => {
                e.preventDefault()
                setShowStip(!showStip)
              }}
            >
              Arbitrum STIP
              <ELabel>ENDED</ELabel>
              <DropdownIcon open={showStip} />
            </StyledNavLink>

            <Column
              sx={{
                padding: '0px 8px',
                height: 'auto',
                maxHeight: showStip ? '300px' : '0',
                transition: 'all 0.3s ease-in-out',
                ovlerflow: 'hidden',
                visibility: showStip ? 'visible' : 'hidden',
              }}
            >
              <NestedNavLink to={APP_PATHS.AGGREGATOR_CAMPAIGN}>
                <li>Aggregator Trading</li>
              </NestedNavLink>
              <NestedNavLink to={APP_PATHS.LIMIT_ORDER_CAMPAIGN}>
                <li>Limit Order</li>
              </NestedNavLink>
              <NestedNavLink to={APP_PATHS.REFFERAL_CAMPAIGN}>
                <li>Referral</li>
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
