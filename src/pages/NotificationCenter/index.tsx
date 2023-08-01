import { Trans } from '@lingui/macro'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import { PrivateAnnouncementType } from 'components/Announcement/type'
import { APP_PATHS } from 'constants/index'
import CreateAlert from 'pages/NotificationCenter/CreateAlert'
import GeneralAnnouncement from 'pages/NotificationCenter/GeneralAnnouncement'
import Menu from 'pages/NotificationCenter/Menu'
import Overview from 'pages/NotificationCenter/Overview'
import PriceAlerts from 'pages/NotificationCenter/PriceAlerts'
import Profile from 'pages/NotificationCenter/Profile'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { MEDIA_WIDTHS } from 'theme'

import PrivateAnnouncement from './PrivateAnnouncement'

const PageWrapper = styled.div`
  padding: 32px 50px;
  width: 100%;
  max-width: 1300px;

  display: flex;
  flex-direction: column;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;
    flex: 1 1 100%;
  `}
`
const Wrapper = styled.div`
  width: 100%;

  display: flex;
  flex-direction: row;

  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    border: none;
    flex-direction: column;
    gap: 16px;
    flex: 1 1 100%;
  `}
`

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;
    padding-left: 16px;
  `}
`

const Title = styled.h2`
  margin-left: 12px;
  font-size: 24px;
  font-weight: 500;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 20px;
  `}
`
const LEFT_MENU_SIZE = '290px'

const LeftColumn = styled.div`
  width: ${LEFT_MENU_SIZE};
  min-width: ${LEFT_MENU_SIZE};

  background-color: ${({ theme }) => theme.tableHeader};
  border-radius: 24px 0px 0px 24px;
  border-right: 1px solid ${({ theme }) => theme.border};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    border: none;
    border-radius: 0;
    width: 100%;
    background-color: unset;
  `}
`
const RightColumn = styled.div`
  background-color: ${({ theme }) => theme.background};
  flex: 1;
  max-width: calc(100% - ${LEFT_MENU_SIZE});
  border-radius: 0px 24px 24px 0px;
  min-height: 200px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    border-radius: 0px;
    max-width: 100%;
    display: flex;
    flex-direction: column;
  `}
`

function NotificationCenter() {
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  return (
    <PageWrapper>
      <HeaderWrapper>
        {isMobile && <Menu />}
        <Title>
          <Trans>Your Profile</Trans>
        </Title>
      </HeaderWrapper>
      <Wrapper>
        {!isMobile && (
          <LeftColumn>
            <Menu />
          </LeftColumn>
        )}
        <RightColumn>
          <Routes>
            <Route path={PROFILE_MANAGE_ROUTES.PROFILE} element={<Profile />} />
            <Route index path={PROFILE_MANAGE_ROUTES.ALL_NOTIFICATION} element={<PrivateAnnouncement />} />
            <Route path={PROFILE_MANAGE_ROUTES.PREFERENCE} element={<Overview />} />

            <Route path={PROFILE_MANAGE_ROUTES.GENERAL} element={<GeneralAnnouncement />} />
            <Route path={PROFILE_MANAGE_ROUTES.PRICE_ALERTS} element={<PriceAlerts />} />
            <Route path={`${PROFILE_MANAGE_ROUTES.PRICE_ALERTS}/*`} element={<PriceAlerts />} />
            <Route
              path={PROFILE_MANAGE_ROUTES.MY_ELASTIC_POOLS}
              element={<PrivateAnnouncement type={PrivateAnnouncementType.ELASTIC_POOLS} />}
            />
            <Route
              path={PROFILE_MANAGE_ROUTES.LIMIT_ORDERS}
              element={<PrivateAnnouncement type={PrivateAnnouncementType.LIMIT_ORDER} />}
            />
            <Route
              path={PROFILE_MANAGE_ROUTES.BRIDGE}
              element={<PrivateAnnouncement type={PrivateAnnouncementType.BRIDGE_ASSET} />}
            />
            <Route
              path={PROFILE_MANAGE_ROUTES.CROSS_CHAIN}
              element={<PrivateAnnouncement type={PrivateAnnouncementType.CROSS_CHAIN} />}
            />
            <Route
              path={PROFILE_MANAGE_ROUTES.KYBER_AI_TOKENS}
              element={<PrivateAnnouncement type={PrivateAnnouncementType.KYBER_AI} />}
            />
            <Route path={PROFILE_MANAGE_ROUTES.CREATE_ALERT} element={<CreateAlert />} />

            <Route
              path="*"
              element={<Navigate to={`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.ALL_NOTIFICATION}`} />}
            />
          </Routes>
        </RightColumn>
      </Wrapper>
    </PageWrapper>
  )
}

export default NotificationCenter
