import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import { ReactComponent as KyberLogo } from 'assets/svg/knc_black.svg'
import Column from 'components/Column'
import LightBulb from 'components/Icons/LightBulb'
import StakeIcon from 'components/Icons/Stake'
import VoteIcon from 'components/Icons/Vote'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

import { DropdownTextAnchor, StyledNavExternalLink, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const KyberDaoWrapper = styled.span`
  display: inline-flex;
`

const KyberDAONavGroup = () => {
  const { pathname } = useLocation()
  const isActive = pathname.includes(APP_PATHS.KYBERDAO_STAKE)
  const { mixpanelHandler } = useMixpanel()
  const upTo500 = useMedia('(max-width: 500px)')
  if (upTo500) return null

  return (
    <KyberDaoWrapper id={TutorialIds.KYBER_DAO_LINK}>
      <NavGroup
        dropdownAlign={upTo500 ? 'right' : 'left'}
        isActive={isActive}
        anchor={
          <DropdownTextAnchor>
            <Trans>KyberDAO</Trans>
          </DropdownTextAnchor>
        }
        dropdownContent={
          <Column>
            <StyledNavLink id="kyberdao-stake-knc" to={APP_PATHS.KYBERDAO_STAKE} style={{ gap: '12px' }}>
              <StakeIcon />
              <Trans>Stake KNC</Trans>
            </StyledNavLink>
            <StyledNavLink id="kyberdao-vote" to={APP_PATHS.KYBERDAO_VOTE} style={{ gap: '12px' }}>
              <VoteIcon />
              <Trans>Vote</Trans>
            </StyledNavLink>
            <StyledNavLink
              id="knc-utility"
              to={APP_PATHS.KYBERDAO_KNC_UTILITY}
              style={{ gap: '12px' }}
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.GAS_REFUND_SOURCE_CLICK, { source: 'KyberDAO_tab' })
              }}
            >
              <KyberLogo width={16} height={16} />
              <Trans>KNC Utility</Trans>
            </StyledNavLink>
            <StyledNavExternalLink
              id="kyberdao-feature-request"
              href="https://kyberswap.canny.io/feature-request"
              target="_blank"
              style={{ gap: '12px' }}
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.KYBER_DAO_FEATURE_REQUEST_CLICK)
              }}
            >
              <LightBulb />
              <Trans>Feature Request</Trans>
            </StyledNavExternalLink>
          </Column>
        }
      />
    </KyberDaoWrapper>
  )
}

export default KyberDAONavGroup
