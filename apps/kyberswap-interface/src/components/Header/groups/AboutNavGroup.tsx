import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { APP_PATHS } from 'constants/index'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { MEDIA_WIDTHS } from 'theme'

import { DropdownTextAnchor, StyledNavExternalLink, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const AboutWrapper = styled.span`
  display: inline-flex;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none
  `}
`

const AboutNavGroup = () => {
  const { pathname } = useLocation()
  const isActive = pathname.includes(APP_PATHS.ABOUT)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { trackingHandler } = useTracking()

  if (upToSmall) return null
  return (
    <AboutWrapper>
      <NavGroup
        dropdownAlign={upToSmall ? 'right' : 'left'}
        isActive={isActive}
        anchor={
          <DropdownTextAnchor>
            <Trans>About</Trans>
          </DropdownTextAnchor>
        }
        dropdownContent={
          <Flex
            sx={{
              flexDirection: 'column',
            }}
          >
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
          </Flex>
        }
      />
    </AboutWrapper>
  )
}

export default AboutNavGroup
