import React, { memo, useMemo } from 'react'
import { X } from 'react-feather'
import { useLocalStorage } from 'react-use'
import { Autoplay, Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

import WorkYourAssetsDesktop from 'assets/banners/work_your_assets_desktop.png'
import WorkYourAssetsMobile from 'assets/banners/work_your_assets_mobile.png'
import WorkYourAssetsTablet from 'assets/banners/work_your_assets_tablet.png'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useWindowSize } from 'hooks/useWindowSize'
import { ExternalLink } from 'theme'

function Banner({
  margin,
  padding,
  maxWidth,
  isInModal = false,
}: {
  margin?: string
  padding?: string
  maxWidth?: string
  isInModal?: boolean
}) {
  const size = useWindowSize()
  const w = size?.width || 0
  const { trackingHandler } = useTracking()

  const ALL_BANNERS = useMemo(
    () => [
      {
        // KyberSwap Work Your Assets
        id: 'KyberSwap-Work-Your-Assets',
        name: 'KyberSwap Work Your Assets',
        start: new Date('2022-12-06T00:00:00.000Z'),
        end: new Date('2022-12-30T23:59:59.000Z'),
        img: isInModal
          ? WorkYourAssetsMobile
          : w > 768
          ? WorkYourAssetsDesktop
          : w > 500
          ? WorkYourAssetsTablet
          : WorkYourAssetsMobile,
        link: 'https://kyberswap.com/elastic/add/0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/40',
      },
    ],
    [isInModal, w],
  )

  const [_showBanner, setShowBanner] = useLocalStorage('show-banner-' + ALL_BANNERS[0].id, true)
  const banners = useMemo(
    () =>
      ALL_BANNERS.filter(b => {
        const date = new Date()
        return b.start <= date && date <= b.end
      }),
    [ALL_BANNERS],
  )
  const showBanner = _showBanner && banners.length

  if (!showBanner) return null

  return (
    <div
      className="ks-banner flex w-full"
      style={{
        margin: margin || 'auto',
        padding,
        maxWidth: maxWidth || '1394px',
      }}
    >
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
              <ExternalLink
                href={banner.link}
                onClick={() => {
                  trackingHandler(TRACKING_EVENT_TYPE.BANNER_CLICK, {
                    banner_name: banner.name,
                    banner_url: banner.link,
                  })
                }}
              >
                <img src={banner.img} alt="banner" width="100%" />
              </ExternalLink>
              <X
                role="button"
                onClick={() => {
                  trackingHandler(TRACKING_EVENT_TYPE.CLOSE_BANNER_CLICK, {
                    banner_name: banner.name,
                    banner_url: banner.link,
                  })
                  setShowBanner(false)
                }}
                className="absolute right-0 top-0 cursor-pointer rounded-bl-lg bg-buttonBlack-40 p-1 text-white"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default memo(Banner)
