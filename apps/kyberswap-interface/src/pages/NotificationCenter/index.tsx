import { Trans } from '@lingui/macro'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useMedia } from 'react-use'

import { PrivateAnnouncementType } from 'components/Announcement/type'
import { APP_PATHS } from 'constants/index'
import CreateAlert from 'pages/NotificationCenter/CreateAlert'
import GeneralAnnouncement from 'pages/NotificationCenter/GeneralAnnouncement'
import Menu from 'pages/NotificationCenter/Menu'
import Overview from 'pages/NotificationCenter/NotificationPreference'
import PriceAlerts from 'pages/NotificationCenter/PriceAlerts'
import PrivateAnnouncement from 'pages/NotificationCenter/PrivateAnnouncement'
import Profile from 'pages/NotificationCenter/Profile'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { MEDIA_WIDTHS } from 'theme'

function NotificationCenter({ redirectRoute }: { redirectRoute?: PROFILE_MANAGE_ROUTES }) {
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  return (
    <div className="flex w-full max-w-[1300px] flex-col px-12 py-8 max-md:flex-1 max-md:basis-full max-md:p-0">
      <div className="flex items-center max-md:px-4 max-md:py-0">
        {isMobile && <Menu />}
        <h2 className="ml-3 text-2xl font-medium max-md:text-xl">
          <Trans>Your Profile</Trans>
        </h2>
      </div>
      <div className="flex w-full flex-row rounded-3xl border border-solid border-border max-md:flex-1 max-md:basis-full max-md:flex-col max-md:gap-4 max-md:rounded-none max-md:border-0">
        {!isMobile && (
          <div className="w-[290px] min-w-[290px] rounded-l-3xl border-r border-solid border-border bg-tableHeader max-md:w-full max-md:rounded-none max-md:border-0 max-md:bg-transparent">
            <Menu />
          </div>
        )}
        <div className="min-h-[200px] max-w-[calc(100%-290px)] flex-1 rounded-r-3xl bg-background max-md:flex max-md:w-full max-md:max-w-full max-md:flex-col max-md:rounded-none">
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
            <Route path={PROFILE_MANAGE_ROUTES.CREATE_ALERT} element={<CreateAlert />} />

            <Route
              path="*"
              element={
                <Navigate
                  to={`${APP_PATHS.PROFILE_MANAGE}${redirectRoute || PROFILE_MANAGE_ROUTES.ALL_NOTIFICATION}`}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default NotificationCenter
