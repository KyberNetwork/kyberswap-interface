import { X } from 'react-feather'
import { Autoplay, Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/swiper-bundle.min.css'
import 'swiper/swiper.min.css'

import { ExternalLink } from 'theme'

export type BannerItem = {
  id: string
  name: string
  img: string
  link: string
}

export default function BannerCarousel({
  banners,
  onClickBanner,
  onClose,
}: {
  banners: BannerItem[]
  onClickBanner: (banner: BannerItem) => void
  onClose: (banner: BannerItem) => void
}) {
  return (
    <Swiper
      autoplay={banners.length > 1 ? { delay: 5000 } : false}
      slidesPerView={1}
      navigation={true}
      pagination={true}
      loop={true}
      modules={[Navigation, Pagination, Autoplay]}
    >
      {banners.map((banner, index) => (
        <SwiperSlide key={index}>
          <div className="relative m-auto w-full overflow-hidden rounded-lg min-[1100px]:max-w-[1054px] min-[1240px]:max-w-[1154px] min-[1320px]:max-w-[1226px] min-[1500px]:max-w-[1394px] [&_img]:rounded-lg">
            <ExternalLink href={banner.link} onClick={() => onClickBanner(banner)}>
              <img src={banner.img} alt="banner" width="100%" />
            </ExternalLink>
            <X
              role="button"
              onClick={() => onClose(banner)}
              className="absolute right-0 top-0 cursor-pointer rounded-bl-lg bg-buttonBlack-40 p-1 text-white"
            />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
