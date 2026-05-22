import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

import NotificationImage from 'assets/images/notification_default.png'
import CtaButton from 'components/Announcement/Popups/CtaButton'
import {
  AnnouncementTemplatePopup,
  PopupContentAnnouncement,
  PopupItemType,
  PopupType,
} from 'components/Announcement/type'
import { AutoColumn } from 'components/Column'
import { Z_INDEXS } from 'constants/styles'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useDetailAnnouncement, useRemovePopup } from 'state/application/hooks'
import { useNavigateToUrl } from 'utils/redirect'

function SnippetPopupItem({
  data,
  index,
  showDetailAnnouncement,
}: {
  index: number
  data: PopupItemType<PopupContentAnnouncement>
  showDetailAnnouncement: (index: number) => void
}) {
  const { templateBody = {} } = data.content
  const { ctas = [], name, thumbnailImageURL } = templateBody as AnnouncementTemplatePopup

  const removePopup = useRemovePopup()
  const toggle = () => {
    showDetailAnnouncement(index)
    removePopup(data)
  }
  const navigate = useNavigateToUrl()
  const ctaInfo = ctas[0]
  const hasCta = Boolean(ctaInfo?.name && ctaInfo?.url)

  const { trackingHandler } = useTracking()
  const trackingClickCta = () => {
    trackingHandler(TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_CTA_POPUP, {
      announcement_type: PopupType.SNIPPET,
      announcement_title: name,
    })
  }

  const onClickCta = () => {
    navigate(ctaInfo?.url)
    removePopup(data)
    trackingClickCta()
  }

  return (
    <div className="relative flex h-[124px] rounded-lg bg-[#313131f2]">
      <img
        onClick={toggle}
        src={thumbnailImageURL || NotificationImage}
        className="h-[124px] max-w-[200px] cursor-pointer rounded-lg object-cover max-sm:hidden"
      />
      <AutoColumn className="flex-1 gap-[14px] py-4 pl-4 pr-10">
        <div
          onClick={toggle}
          className="h-[42px] max-w-full cursor-pointer overflow-hidden text-ellipsis text-sm font-medium leading-5 text-text [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]"
        >
          {name}
        </div>
        <div
          className="relative flex items-end gap-3"
          style={{ justifyContent: hasCta ? 'space-between' : 'flex-start' }}
        >
          {hasCta && <CtaButton className="!text-sm" data={ctaInfo} color="link" onClick={onClickCta} />}
          <div
            onClick={toggle}
            className="flex cursor-pointer select-none items-center whitespace-nowrap text-right text-sm font-medium text-subText"
          >
            <Trans>Read More</Trans>
          </div>
        </div>
      </AutoColumn>
    </div>
  )
}

export default function SnippetPopup({
  data,
  clearAll,
}: {
  data: PopupItemType<PopupContentAnnouncement>[]
  clearAll: () => void
}) {
  const theme = useTheme()
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
    <div
      className="ks-snippet-popup fixed bottom-[30px] left-[30px] w-[470px] max-md:bottom-[74px] max-sm:inset-x-0 max-sm:w-full max-sm:px-4"
      style={{ zIndex: Z_INDEXS.POPUP_NOTIFICATION }}
    >
      <Swiper
        slidesPerView={1}
        navigation
        autoHeight
        pagination
        loop={data.length > 1}
        observer
        observeParents
        modules={[Navigation, Pagination]}
      >
        {data.map((banner, index) => (
          <SwiperSlide key={banner.key}>
            <SnippetPopupItem index={index} data={banner} showDetailAnnouncement={showDetailAnnouncement} />
          </SwiperSlide>
        ))}
      </Swiper>
      <X
        color={theme.subText}
        onClick={() => {
          clearAll()
          trackingClose()
        }}
        className="absolute right-3 top-3 z-[1] h-[18px] w-[18px] cursor-pointer max-sm:right-[calc(12px+16px)] max-sm:h-[22px] max-sm:w-[22px]"
      />
    </div>
  )
}
