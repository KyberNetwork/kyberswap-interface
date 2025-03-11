import { Trans } from '@lingui/macro'
import { lighten } from 'polished'
import { Link, useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import styled from 'styled-components'

import Announcement from 'components/Announcement'
import SelectNetwork from 'components/Header/web3/SelectNetwork'
import SelectWallet from 'components/Header/web3/SelectWallet'
import Menu, { NewLabel } from 'components/Menu'
import Row, { RowFixed } from 'components/Row'
import { AGGREGATOR_ANALYTICS_URL, APP_PATHS } from 'constants/index'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useHolidayMode } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'

import AboutNavGroup from './groups/AboutNavGroup'
import KyberDAONavGroup from './groups/KyberDaoGroup'
import SwapNavGroup from './groups/SwapNavGroup'
import { StyledNavExternalLink, StyledNavLink } from './styleds'

const HeaderFrame = styled.div<{ hide?: boolean }>`
  height: ${({ hide }) => (hide ? 0 : undefined)};
  padding: ${({ hide }) => (hide ? 0 : '1rem')};
  overflow: ${({ hide }) => (hide ? 'hidden' : undefined)};
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  z-index: ${Z_INDEXS.HEADER};
  ${({ theme, hide }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    padding: ${hide ? 0 : '1rem'};
    width: calc(100%);
    position: relative;
    
  `};

  ${({ theme, hide }) => theme.mediaWidth.upToExtraSmall`
    padding: ${hide ? 0 : '0.5 1rem'};
    height: ${hide ? 0 : '60px'};
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

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
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
  margin-top: ${({ isChristmas }) => (isChristmas ? '-9px' : '1px')};

  ${({ theme, isChristmas }) => theme.mediaWidth.upToSmall`
    width: 114px;
    margin-top: ${isChristmas ? '-2px' : '1px'};
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width:100px;
  `}
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
  const [holidayMode] = useHolidayMode()
  const theme = useTheme()
  const { pathname } = useLocation()
  const isPartnerSwap = pathname.startsWith(APP_PATHS.PARTNER_SWAP)

  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const menu = (
    <HeaderElementWrap>
      <Announcement />
      <div style={{ height: '18px', borderLeft: `2px solid ${theme.subText}` }} />
      <Menu />
    </HeaderElementWrap>
  )

  return (
    <HeaderFrame hide={isPartnerSwap && upToLarge}>
      <HeaderRow>
        {isPartnerSwap ? (
          <LogoIcon>
            <IconImage src={'/logo-dark.svg'} alt="logo" />
          </LogoIcon>
        ) : (
          <Title to={`${APP_PATHS.SWAP}/${networkInfo.route}`}>
            {holidayMode ? (
              <LogoIcon>
                <IconImage isChristmas src={'/christmas-logo-dark.svg?'} alt="logo" />
              </LogoIcon>
            ) : (
              <LogoIcon>
                <IconImage src={'/logo-dark.svg'} alt="logo" />
              </LogoIcon>
            )}
          </Title>
        )}
        {!isPartnerSwap && (
          <HeaderLinks>
            <SwapNavGroup />
            <StyledNavLink to={`${APP_PATHS.EARN}`}>
              <Flex>
                Earn
                <NewLabel>New</NewLabel>
              </Flex>
            </StyledNavLink>
            <StyledNavLink to={`${APP_PATHS.MARKET_OVERVIEW}`}>Market</StyledNavLink>
            <KyberDAONavGroup />
            <StyledNavExternalLink target="_blank" href={AGGREGATOR_ANALYTICS_URL}>
              <Trans>Analytics</Trans>
            </StyledNavExternalLink>
            <AboutNavGroup />
          </HeaderLinks>
        )}
      </HeaderRow>

      <HeaderControls>
        {isPartnerSwap ? (
          <Flex justifyContent="space-between" width="100%">
            {upToLarge && (
              <LogoIcon>
                <IconImage src={'/logo-dark.svg'} alt="logo" />
              </LogoIcon>
            )}

            <Flex sx={{ gap: '1rem' }} height="42px">
              <SelectNetwork />
              <SelectWallet />
            </Flex>
          </Flex>
        ) : upToXXSmall ? (
          <HeaderElement>
            <SelectNetwork />
            <SelectWallet />
            {menu}
          </HeaderElement>
        ) : (
          <>
            <HeaderElement style={{ justifyContent: 'flex-start' }}>
              <SelectNetwork />
              <SelectWallet />
            </HeaderElement>
            <HeaderElement style={{ justifyContent: 'flex-end' }}>{menu}</HeaderElement>
          </>
        )}
      </HeaderControls>
    </HeaderFrame>
  )
}
