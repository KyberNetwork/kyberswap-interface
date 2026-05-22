import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import Column from 'components/Column'
import { NewLabel } from 'components/Menu'
import { APP_PATHS } from 'constants/index'
import { cn } from 'utils/cn'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const showCampaignNew = new Date() < new Date('2026-05-04T23:59:59Z')

const CampaignNavGroup = () => {
  const { pathname } = useLocation()
  const isActiveMayTrading = pathname.includes('/campaigns/may-trading')
  const isActive = pathname.includes('/campaigns') && !isActiveMayTrading
  const upTo500 = useMedia('(max-width: 500px)')

  const [showStip, setShowStip] = useState(false)

  if (upTo500) return null

  return (
    <NavGroup
      dropdownAlign={upTo500 ? 'right' : 'left'}
      isActive={isActive}
      anchor={
        <DropdownTextAnchor style={{ display: 'flex', position: 'relative', width: 'max-content' }}>
          <Trans>Campaigns</Trans>
          {showCampaignNew && <NewLabel isNew>{t`New`}</NewLabel>}
        </DropdownTextAnchor>
      }
      dropdownContent={
        <Column>
          <StyledNavLink to={APP_PATHS.SAFEPAL_CAMPAIGN}>
            <Trans>Wallet Campaign</Trans>
            {showCampaignNew ? <NewLabel isNew>{t`New`}</NewLabel> : <NewLabel>{t`Ended`}</NewLabel>}
          </StyledNavLink>

          <StyledNavLink to={APP_PATHS.RAFFLE_CAMPAIGN}>
            <Trans>Weekly Rewards</Trans>
            <NewLabel>{t`Ended`}</NewLabel>
          </StyledNavLink>

          <StyledNavLink to={APP_PATHS.NEAR_INTENTS_CAMPAIGN}>
            <Trans>Cross Chain Campaign</Trans>
            <NewLabel>{t`Ended`}</NewLabel>
          </StyledNavLink>

          <StyledNavLink to={APP_PATHS.MAY_TRADING_CAMPAIGN}>
            <Trans>May Trading</Trans>
            <NewLabel>{t`Ended`}</NewLabel>
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
            <NewLabel>{t`Ended`}</NewLabel>
            <DropdownSVG className={cn('transition-transform duration-300', showStip ? 'rotate-180' : 'rotate-0')} />
          </StyledNavLink>

          <Column
            style={{
              padding: '0px 8px',
              height: 'auto',
              maxHeight: showStip ? '300px' : '0',
              transition: 'all 0.3s ease-in-out',
              overflow: 'hidden',
              visibility: showStip ? 'visible' : 'hidden',
            }}
          >
            <StyledNavLink to={APP_PATHS.AGGREGATOR_CAMPAIGN} className="!gap-3 !text-sm">
              <li>{t`Aggregator Trading`}</li>
            </StyledNavLink>
            <StyledNavLink to={APP_PATHS.LIMIT_ORDER_CAMPAIGN} className="!gap-3 !text-sm">
              <li>{t`Limit Order`}</li>
            </StyledNavLink>
            <StyledNavLink to={APP_PATHS.REFFERAL_CAMPAIGN} className="!gap-3 !text-sm">
              <li>{t`Referral`}</li>
            </StyledNavLink>
          </Column>
          <StyledNavLink to={APP_PATHS.MY_DASHBOARD} style={{ gap: '12px' }}>
            <Trans>My Dashboard</Trans>
          </StyledNavLink>
        </Column>
      }
    />
  )
}

export default CampaignNavGroup
