import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'

import { ReactComponent as KyberLogo } from 'assets/svg/kyber/knc_black.svg'
import Column from 'components/Column'
import NavGroup, { type DropdownAlign } from 'components/Header/groups/NavGroup'
import { DropdownTextAnchor, StyledNavLink } from 'components/Header/styleds'
import StakeIcon from 'components/Icons/Stake'
import VoteIcon from 'components/Icons/Vote'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'

type Props = {
  dropdownAlign?: DropdownAlign
}

const KyberDAONavGroup = ({ dropdownAlign }: Props) => {
  const { pathname } = useLocation()
  const isActive = pathname.includes(APP_PATHS.KYBERDAO_STAKE)

  const { trackingHandler } = useTracking()

  return (
    <span id={TutorialIds.KYBER_DAO_LINK} className="inline-flex">
      <NavGroup
        dropdownAlign={dropdownAlign}
        isActive={isActive}
        anchor={
          <DropdownTextAnchor>
            <Trans>KyberDAO</Trans>
          </DropdownTextAnchor>
        }
        dropdownContent={
          <Column>
            <StyledNavLink id="kyberdao-stake-knc" to={APP_PATHS.KYBERDAO_STAKE} className="items-center gap-3">
              <StakeIcon />
              <Trans>Stake KNC</Trans>
            </StyledNavLink>
            <StyledNavLink id="kyberdao-vote" to={APP_PATHS.KYBERDAO_VOTE} className="items-center gap-3">
              <VoteIcon />
              <Trans>Vote</Trans>
            </StyledNavLink>
            <StyledNavLink
              id="knc-utility"
              to={APP_PATHS.KYBERDAO_KNC_UTILITY}
              className="items-center gap-3"
              onClick={() => {
                trackingHandler(TRACKING_EVENT_TYPE.GAS_REFUND_SOURCE_CLICK, { source: 'KyberDAO_tab' })
              }}
            >
              <KyberLogo width={16} height={16} />
              <Trans>KNC Utility</Trans>
            </StyledNavLink>
            {/* <StyledNavExternalLink
              id="kyberdao-feature-request"
              href="https://kyberswap.canny.io/feature-request"
              target="_blank"
              className="items-center gap-3"
              onClick={() => {
                trackingHandler(TRACKING_EVENT_TYPE.KYBER_DAO_FEATURE_REQUEST_CLICK)
              }}
            >
              <LightBulb />
              <Trans>Feature Request</Trans>
            </StyledNavExternalLink> */}
          </Column>
        }
      />
    </span>
  )
}

export default KyberDAONavGroup
