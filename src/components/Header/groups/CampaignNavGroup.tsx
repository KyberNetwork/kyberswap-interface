import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'

import { ReactComponent as AirdropIcon } from 'assets/svg/airdrop.svg'
import { ReactComponent as GrantCampaignIcon } from 'assets/svg/grant_campaign.svg'
import Icon from 'components/Icons/Icon'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const CampaignNavGroup = () => {
  const upTo560 = useMedia('(max-width: 560px)')
  const { pathname } = useLocation()
  const isActive = [APP_PATHS.CAMPAIGN, APP_PATHS.GRANT_PROGRAMS].some(path => pathname.includes(path))

  if (upTo560) {
    return null
  }

  return (
    <NavGroup
      id={TutorialIds.CAMPAIGN_LINK}
      isActive={isActive}
      anchor={
        <DropdownTextAnchor>
          <Trans>Campaigns</Trans>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <Flex
          sx={{
            flexDirection: 'column',
          }}
        >
          <StyledNavLink id="campaigns" to={APP_PATHS.CAMPAIGN}>
            <Flex sx={{ gap: '10px' }} alignItems="center">
              <Icon id="speaker" /> <Trans>Trading Campaigns</Trans>
            </Flex>
          </StyledNavLink>

          <StyledNavLink id="project-trading-grant" to={APP_PATHS.GRANT_PROGRAMS}>
            <Flex sx={{ gap: '12px' }} alignItems="center">
              <GrantCampaignIcon style={{ width: '20px' }} /> <Trans>Trading Grant Campaign</Trans>
            </Flex>
          </StyledNavLink>

          <StyledNavLink id="airdrop-campaigns" to={APP_PATHS.AIRDROP_CAMPAIGN}>
            <Flex sx={{ gap: '14px', paddingLeft: '1px' }} alignItems="center">
              <AirdropIcon style={{ width: '18px', height: '18px' }} />
              <Trans>Airdrop Campaign</Trans>
            </Flex>
          </StyledNavLink>
        </Flex>
      }
    />
  )
}

export default CampaignNavGroup
