import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { APP_PATHS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

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
  const upTo1000 = useMedia('(max-width: 1000px)')

  const { mixpanelHandler } = useMixpanel()
  return (
    <AboutWrapper>
      <NavGroup
        dropdownAlign={upTo1000 ? 'right' : 'left'}
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
                mixpanelHandler(MIXPANEL_TYPE.BLOG_MENU_CLICKED)
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
