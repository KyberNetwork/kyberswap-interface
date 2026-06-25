import { Suspense, lazy } from 'react'
import { X } from 'react-feather'

import { AnnouncementTemplatePopup, PopupContentAnnouncement, PopupItemType } from 'components/Announcement/type'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useDetailAnnouncement } from 'state/application/hooks'

const SnippetPopupCarousel = lazy(() => import('components/Announcement/Popups/SnippetPopupCarousel'))

export default function SnippetPopup({
  data,
  clearAll,
}: {
  data: PopupItemType<PopupContentAnnouncement>[]
  clearAll: () => void
}) {
  const [, setAnnouncementDetail] = useDetailAnnouncement()
  const showDetailAnnouncement = (selectedIndex: number) => {
    setAnnouncementDetail({
      announcements: data.map(e => e.content.templateBody) as AnnouncementTemplatePopup[],
      selectedIndex,
      hasMore: false,
    })
    clearAll()
  }

  const { trackingHandler } = useTracking()
  const trackingClose = () =>
    trackingHandler(TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_CLOSE_POPUP, { message_title: 'snippet_popups' })

  return (
    <div className="ks-snippet-popup fixed bottom-[30px] left-[30px] z-[9999] w-[470px] max-md:bottom-[74px] max-sm:inset-x-0 max-sm:w-full max-sm:px-4">
      <Suspense fallback={null}>
        <SnippetPopupCarousel data={data} showDetailAnnouncement={showDetailAnnouncement} />
      </Suspense>
      <X
        onClick={() => {
          clearAll()
          trackingClose()
        }}
        className="absolute right-3 top-3 z-[1] h-[18px] w-[18px] cursor-pointer text-subText max-sm:right-[calc(12px+16px)] max-sm:h-[22px] max-sm:w-[22px]"
      />
    </div>
  )
}
