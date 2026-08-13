import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'

import NavGroup, { type DropdownAlign } from 'components/Header/groups/NavGroup'
import { DropdownTextAnchor, StyledNavExternalLink, StyledNavLink } from 'components/Header/styleds'
import { APP_PATHS } from 'constants/index'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'

type Props = {
  dropdownAlign?: DropdownAlign
}

const AboutNavGroup = ({ dropdownAlign }: Props) => {
  const { pathname } = useLocation()
  const isActive = pathname.includes(APP_PATHS.ABOUT)

  const { trackingHandler } = useTracking()

  return (
    <NavGroup
      dropdownAlign={dropdownAlign}
      isActive={isActive}
      anchor={
        <DropdownTextAnchor>
          <Trans>About</Trans>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <div className="flex flex-col">
          <StyledNavLink id="about-kyberswap" to={`${APP_PATHS.ABOUT}/kyberswap`}>
            <Trans>KyberSwap</Trans>
          </StyledNavLink>

          <StyledNavLink id="about-knc" to={`${APP_PATHS.ABOUT}/knc`}>
            <Trans> KNC</Trans>
          </StyledNavLink>
          <StyledNavExternalLink
            onClick={() => {
              trackingHandler(TRACKING_EVENT_TYPE.BLOG_MENU_CLICKED)
            }}
            target="_blank"
            href="https://blog.kyberswap.com"
          >
            <Trans>Blog</Trans>
          </StyledNavExternalLink>
        </div>
      }
    />
  )
}

export default AboutNavGroup
