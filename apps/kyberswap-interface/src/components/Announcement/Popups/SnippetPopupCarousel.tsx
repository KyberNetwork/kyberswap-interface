import { Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/swiper-bundle.min.css'
import 'swiper/swiper.min.css'

import SnippetPopupItem from 'components/Announcement/Popups/SnippetPopupItem'
import { PopupContentAnnouncement, PopupItemType } from 'components/Announcement/type'

export default function SnippetPopupCarousel({
  data,
  showDetailAnnouncement,
}: {
  data: PopupItemType<PopupContentAnnouncement>[]
  showDetailAnnouncement: (index: number) => void
}) {
  return (
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
  )
}
