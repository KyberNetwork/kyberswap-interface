import { Trans } from '@lingui/macro'
import { darken } from 'polished'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import { RowFit } from 'components/Row'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'

import SlideToUnlock from './SlideToUnlock'
import NavGroup from './groups/NavGroup'
import { DropdownTextAnchor, StyledNavLink } from './styleds'

const CustomSlideToUnlock = styled(SlideToUnlock)`
  background: linear-gradient(
    to right,
    ${({ theme }) => theme.subText} 0,
    white 10%,
    ${({ theme }) => theme.subText} 20%
  );
  background-clip: text;
  -webkit-background-clip: text;

  &[data-active='true'] {
    background: linear-gradient(
      to right,
      ${({ theme }) => theme.primary} 0,
      white 10%,
      ${({ theme }) => theme.primary} 20%
    );
    /* Repetitive but not redundant */
    background-clip: text;
    -webkit-background-clip: text;
  }
`

const KyberAIWrapper = styled(NavGroup)`
  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    display: none;
  `};

  :hover {
    ${CustomSlideToUnlock} {
      background: linear-gradient(
        to right,
        ${({ theme }) => darken(0.1, theme.primary)} 0,
        white 10%,
        ${({ theme }) => darken(0.1, theme.primary)} 20%
      );
      /* Repetitive but not redundant */
      background-clip: text;
      -webkit-background-clip: text;
    }
  }
`

const KyberAINavItem = () => {
  const { pathname } = useLocation()
  const isActive = pathname.includes(APP_PATHS.KYBERAI)
  return (
    <KyberAIWrapper
      id={TutorialIds.DISCOVER_LINK}
      isActive={isActive}
      anchor={
        <DropdownTextAnchor>
          <CustomSlideToUnlock data-active={isActive}>
            <RowFit>
              <Icon id={'truesight-v2'} size={16} style={{ marginRight: '6px' }} />
              <Trans>KyberAI</Trans>
            </RowFit>
          </CustomSlideToUnlock>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <Column>
          <StyledNavLink id="kyberai_about" to={APP_PATHS.KYBERAI_RANKINGS} style={{ gap: '4px' }}>
            <Icon id="info" size={16} />
            <Trans>About</Trans>
          </StyledNavLink>
          <StyledNavLink id="kyberai_ranking" to={APP_PATHS.KYBERAI_RANKINGS} style={{ gap: '4px' }}>
            <Icon id="leaderboard" size={16} />
            <Trans>Ranking</Trans>
          </StyledNavLink>

          <StyledNavLink id="kyberai_explore" to={APP_PATHS.KYBERAI_EXPLORE} style={{ gap: '4px' }}>
            <Icon id="truesight-v2" size={16} />
            <Trans>Explore</Trans>
          </StyledNavLink>
        </Column>
      }
    />
  )
}

export default KyberAINavItem
