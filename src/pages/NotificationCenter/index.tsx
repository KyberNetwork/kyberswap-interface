import { Trans } from '@lingui/macro'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Flex } from 'rebass'
import styled from 'styled-components'

import MailIcon from 'components/Icons/MailIcon'
import { APP_PATHS } from 'constants/index'
import CreateAlert from 'pages/NotificationCenter/CreateAlert'
import Menu from 'pages/NotificationCenter/Menu'
import PriceAlerts from 'pages/NotificationCenter/PriceAlerts'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'

const PageWrapper = styled.div`
  padding: 32px 50px;
  width: 100%;
  max-width: 1300px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;
  `}
`
const Wrapper = styled.div`
  display: flex;
  width: 100%;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 24px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    border: none;
  `}
`

const Title = styled.h2`
  margin-left: 12px;
  font-size: 24px;
  font-weight: 500;
`

const LeftColumn = styled.div`
  background-color: ${({ theme }) => theme.tableHeader};
  border-radius: 24px 0px 0px 24px;
  width: 280px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`
const RightColumn = styled.div`
  background-color: ${({ theme }) => theme.background};
  flex: 1;
  border-radius: 0px 24px 24px 0px;

  padding: 24px;
  border-left: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 24px 0px;
    border-radius: 0px;
  `}
`

function NotificationCenter() {
  return (
    <PageWrapper>
      <Flex alignItems="center">
        <MailIcon />
        <Title>
          <Trans>Notification Center</Trans>
        </Title>
      </Flex>
      <Wrapper>
        <LeftColumn>
          <Menu />
        </LeftColumn>
        <RightColumn>
          <Routes>
            <Route index path={NOTIFICATION_ROUTES.ALL} element={<div>All notification</div>} />
            <Route path={NOTIFICATION_ROUTES.OVERVIEW} element={<div>Notification Overview</div>} />
            <Route path={NOTIFICATION_ROUTES.GENERAL} element={<div>General</div>} />
            <Route path={NOTIFICATION_ROUTES.PRICE_ALERTS} element={<PriceAlerts />} />
            <Route path={NOTIFICATION_ROUTES.MY_ELASTIC_POOLS} element={<div>My Elastic Pools</div>} />
            <Route path={NOTIFICATION_ROUTES.LIMIT_ORDERS} element={<div>Limit Orders</div>} />
            <Route path={NOTIFICATION_ROUTES.BRIDGE} element={<div>Cross-Chain Bridge</div>} />
            <Route path={NOTIFICATION_ROUTES.TRENDING_SOON_TOKENS} element={<div>Trending Soon Tokens</div>} />
            <Route path={NOTIFICATION_ROUTES.CREATE_ALERT} element={<CreateAlert />} />

            <Route path="*" element={<Navigate to={`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.ALL}`} />} />
          </Routes>
        </RightColumn>
      </Wrapper>
    </PageWrapper>
  )
}

export default NotificationCenter
