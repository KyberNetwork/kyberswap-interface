import { Navigate, Route, Routes } from 'react-router-dom'
import styled from 'styled-components'

import { APP_PATHS } from 'constants/index'
import ActiveAlerts from 'pages/NotificationCenter/PriceAlerts/ActiveAlerts'
import AlertsHistory from 'pages/NotificationCenter/PriceAlerts/AlertsHistory'
import TitleOnMobile from 'pages/NotificationCenter/PriceAlerts/TitleOnMobile'
import { NOTIFICATION_ROUTES, PRICE_ALERTS_ROUTES } from 'pages/NotificationCenter/const'

export const ShareWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;

  padding: 24px;
  padding-bottom: 0;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex: 1;
    padding: 0;

    ${ShareContentWrapper} {
      flex: 1;
      padding: 0 16px;
    }
  `}
`

export const ShareContentWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
`

const PriceAlerts = () => {
  return (
    <ShareWrapper>
      <TitleOnMobile />
      <ShareContentWrapper>
        <Routes>
          <Route index path={PRICE_ALERTS_ROUTES.ACTIVE} element={<ActiveAlerts />} />
          <Route path={PRICE_ALERTS_ROUTES.HISTORY} element={<AlertsHistory />} />
          <Route
            path="*"
            element={
              <Navigate
                replace
                to={`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PRICE_ALERTS}${PRICE_ALERTS_ROUTES.ACTIVE}`}
              />
            }
          />
        </Routes>
      </ShareContentWrapper>
    </ShareWrapper>
  )
}

export default PriceAlerts
