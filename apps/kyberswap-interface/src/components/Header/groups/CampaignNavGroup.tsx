import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import Column from 'components/Column'
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

const ELabel = styled.span<{ isNew?: boolean }>`
  font-size: 10px;
  margin-left: 4px;
  color: ${({ theme, isNew }) => (isNew ? theme.red : theme.subText)};
`

const NestedNavLink = styled(StyledNavLink)`
  font-size: 14px;
  gap: 12px;
`

const showCampaignNew = new Date() < new Date('2026-04-30T23:59:59Z')

const CampaignNavGroup = () => {
  const { pathname } = useLocation()
  const isActiveMayTrading = pathname.includes('/campaigns/may-trading')
  const isActive = pathname.includes('/campaigns') && !isActiveMayTrading
  // const upTo420 = useMedia('(max-width: 420px)')
  const upTo500 = useMedia('(max-width: 500px)')

  const [showStip, setShowStip] = useState(false)

  if (upTo500) return null

  return (
    <>
      <StyledNavGroup
        dropdownAlign={upTo500 ? 'right' : 'left'}
        isActive={isActive}
        anchor={
          <DropdownTextAnchor style={{ display: 'flex', position: 'relative', width: 'max-content' }}>
            <Trans>Campaigns</Trans>
            {showCampaignNew && <ELabel isNew>{t`New`}</ELabel>}
          </DropdownTextAnchor>
        }
        dropdownContent={
          <Column>
            <StyledNavLink to={APP_PATHS.SAFEPAL_CAMPAIGN}>
              <Trans>SafePal Campaign</Trans>
              {showCampaignNew ? <ELabel isNew>{t`New`}</ELabel> : <ELabel>{t`Ended`}</ELabel>}
            </StyledNavLink>

            <StyledNavLink to={APP_PATHS.RAFFLE_CAMPAIGN}>
              <Trans>Weekly Rewards</Trans>
              <ELabel>{t`Ended`}</ELabel>
            </StyledNavLink>

            <StyledNavLink to={APP_PATHS.NEAR_INTENTS_CAMPAIGN}>
              <Trans>Cross Chain Campaign</Trans>
              <ELabel>{t`Ended`}</ELabel>
            </StyledNavLink>

            <StyledNavLink to={APP_PATHS.MAY_TRADING_CAMPAIGN}>
              <Trans>May Trading</Trans>
              <ELabel>{t`Ended`}</ELabel>
            </StyledNavLink>

            <StyledNavLink
              to={APP_PATHS.AGGREGATOR_CAMPAIGN}
              style={{ paddingRight: '0' }}
              onClick={e => {
                e.preventDefault()
                setShowStip(!showStip)
              }}
            >
              Arbitrum STIP
              <ELabel>{t`Ended`}</ELabel>
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
                <li>{t`Aggregator Trading`}</li>
              </NestedNavLink>
              <NestedNavLink to={APP_PATHS.LIMIT_ORDER_CAMPAIGN}>
                <li>{t`Limit Order`}</li>
              </NestedNavLink>
              <NestedNavLink to={APP_PATHS.REFFERAL_CAMPAIGN}>
                <li>{t`Referral`}</li>
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
