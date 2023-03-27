import { CSSProperties } from 'styled-components'

import { PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { PriceAlertAnnouncement } from 'pages/NotificationCenter/PriceAlerts/CommonSingleAlert'

import Bridge from './Bridge'
import LimitOrder from './LimitOrder'
import PoolPosition from './PoolPosition'
import TrendingSoon from './TrendingSoon'

// todo refactor inbox item vs inbox item in noti center
// todo any
export default function AnnouncementItem({
  announcement,
  style,
}: {
  announcement: PrivateAnnouncement
  style?: CSSProperties
}) {
  const { templateType } = announcement
  try {
    switch (templateType) {
      case PrivateAnnouncementType.POOL_POSITION:
        return <PoolPosition announcement={announcement as any} />
      case PrivateAnnouncementType.LIMIT_ORDER:
        return <LimitOrder announcement={announcement as any} />
      case PrivateAnnouncementType.TRENDING_SOON_TOKEN:
        return <TrendingSoon announcement={announcement as any} />
      case PrivateAnnouncementType.BRIDGE:
        return <Bridge announcement={announcement as any} />
      case PrivateAnnouncementType.PRICE_ALERT:
        return <PriceAlertAnnouncement announcement={announcement as any} />
      default:
        return null
    }
  } catch (error) {
    return null
  }
}
