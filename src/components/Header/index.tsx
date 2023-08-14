import { Trans } from '@lingui/macro'
import { lighten } from 'polished'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import Announcement from 'components/Announcement'
import CampaignNavGroup from 'components/Header/groups/CampaignNavGroup'
import SelectNetwork from 'components/Header/web3/SelectNetwork'
import SelectWallet from 'components/Header/web3/SelectWallet'
import SignWallet from 'components/Header/web3/SignWallet'
import Menu from 'components/Menu'
import Row, { RowFixed } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useHolidayMode, useIsDarkMode } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'

import KyberAINavItem from './KyberAINavItem'
import AboutNavGroup from './groups/AboutNavGroup'
import AnalyticNavGroup from './groups/AnalyticNavGroup'
import EarnNavGroup from './groups/EarnNavGroup'
import KyberDAONavGroup from './groups/KyberDaoGroup'
import SwapNavGroup from './groups/SwapNavGroup'
import { StyledNavExternalLink } from './styleds'

const HeaderFrame = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem;
  z-index: ${Z_INDEXS.HEADER};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    padding: 1rem;
    width: calc(100%);
    position: relative;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0.5rem 1rem;
    height: 60px;
  `}
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: row;
    justify-content: space-between;
    justify-self: center;
    padding: 1rem;
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;
    z-index: 98;
    height: 72px;
    background-color: ${({ theme }) => theme.buttonBlack};
  `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
      height: 60px;
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      padding: 1rem 8px;
  `};
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: center;
    width: 100%;
    justify-content: space-between;
  `};
`

const HeaderElementWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0px 6px;
  border-radius: 36px;
  background-color: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  :hover,
  :focus {
    background-color: ${({ theme }) => lighten(0.05, theme.background)};
    border: 1px solid ${({ theme }) => theme.primary};
  }
`

const HeaderRow = styled(RowFixed)`
  ${({ theme }) => theme.mediaWidth.upToMedium`
   width: 100%;
  `};
`

const HeaderLinks = styled(Row)`
  gap: 4px;
  justify-content: center;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    justify-content: flex-end;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
     gap: 0px;
  `}
`

const IconImage = styled.img<{ isChristmas?: boolean }>`
  width: 140px;
  margin-top: ${({ isChristmas }) => (isChristmas ? '-18px' : '1px')};

  ${({ theme, isChristmas }) => theme.mediaWidth.upToSmall`
    width: 114px;
    margin-top: ${isChristmas ? '-10px' : '1px'};
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width:100px;
  `}
`

const BlogWrapper = styled.span`
  @media (max-width: 1600px) {
    display: none;
  }
`

const Title = styled(Link)`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`

const LogoIcon = styled.div`
  transition: transform 0.3s ease;

  :hover {
    transform: rotate(-5deg);
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    :hover {
      transform: rotate(0);
    }
  `}
`

export default function Header() {
  const { networkInfo } = useActiveWeb3React()
  const isDark = useIsDarkMode()
  const [holidayMode] = useHolidayMode()
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const menu = (
    <HeaderElementWrap>
      <Announcement />
      <div style={{ height: '18px', borderLeft: `2px solid ${theme.subText}` }} />
      <Menu />
    </HeaderElementWrap>
  )
  return (
    <HeaderFrame>
      <HeaderRow>
        <Title to={`${APP_PATHS.SWAP}/${networkInfo.route}`}>
          {holidayMode ? (
            <LogoIcon>
              <IconImage
                isChristmas
                src={isDark ? '/christmas-logo-dark.svg' : '/christmas-logo-light.svg'}
                alt="logo"
              />
            </LogoIcon>
          ) : (
            <LogoIcon>
              <IconImage src={isDark ? '/logo-dark.svg' : '/logo.svg'} alt="logo" />
            </LogoIcon>
          )}
        </Title>
        <HeaderLinks>
          <SwapNavGroup />
          <EarnNavGroup />
          <KyberAINavItem />
          <CampaignNavGroup />
          <KyberDAONavGroup />
          <AnalyticNavGroup />
          <AboutNavGroup />
          <BlogWrapper>
            <StyledNavExternalLink
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.BLOG_MENU_CLICKED)
              }}
              target="_blank"
              href="https://blog.kyberswap.com"
            >
              <Trans>Blog</Trans>
            </StyledNavExternalLink>
          </BlogWrapper>
        </HeaderLinks>
      </HeaderRow>
      <HeaderControls>
        {upToExtraSmall ? (
          <HeaderElement>
            <SelectNetwork />
            <SelectWallet />
            {menu}
            <SignWallet />
          </HeaderElement>
        ) : (
          <>
            <HeaderElement style={{ justifyContent: 'flex-start' }}>
              <SelectNetwork />
              <SelectWallet />
            </HeaderElement>
            <HeaderElement style={{ justifyContent: 'flex-end' }}>
              {menu}
              <SignWallet />
            </HeaderElement>
          </>
        )}
      </HeaderControls>
    </HeaderFrame>
  )
}
