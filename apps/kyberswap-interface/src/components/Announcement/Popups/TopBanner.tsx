import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'

import CtaButton from 'components/Announcement/Popups/CtaButton'
import { AnnouncementTemplatePopup, PopupType } from 'components/Announcement/type'
import Announcement from 'components/Icons/Announcement'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useActivePopups, useRemoveAllPopupByType } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { useNavigateToUrl } from 'utils/redirect'
import { escapeScriptHtml } from 'utils/string'

const DEFAULT_ANIMATION_DURATION = 12
const ICON_SIZE = 24
const MARQUEE_GAP = 32

function TopBanner() {
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { topPopups } = useActivePopups()
  const { trackingHandler } = useTracking()

  const removeAllPopupByType = useRemoveAllPopupByType()
  const navigate = useNavigateToUrl()

  const textWrapperRef = useRef<HTMLDivElement>(null)
  const textLineRef = useRef<HTMLDivElement>(null)

  const [isOverflow, setIsOverflow] = useState(false)
  const [animationDuration, setAnimationDuration] = useState(DEFAULT_ANIMATION_DURATION)
  const [marqueeShift, setMarqueeShift] = useState(0)

  const popupInfo = topPopups[topPopups.length - 1]
  const templateBody = popupInfo?.content.templateBody as AnnouncementTemplatePopup | undefined

  const content = templateBody?.content ?? ''
  const ctas = templateBody?.ctas ?? []
  const name = templateBody?.name ?? ''
  const primaryCta = ctas[0]
  const ctaName = primaryCta?.name
  const ctaUrl = primaryCta?.url
  const hasCta = Boolean(ctaName && ctaUrl)

  const sanitizedContent = useMemo(
    () => escapeScriptHtml(isMobile ? content.replace(/<br\/>/g, '&nbsp;') : content),
    [content, isMobile],
  )

  useEffect(() => {
    const measure = () => {
      const textWrapperNode = textWrapperRef.current
      const textLineNode = textLineRef.current

      if (!textWrapperNode || !textLineNode) return

      const wrapperWidth = textWrapperNode.clientWidth
      const textWidth = textLineNode.scrollWidth
      const nextIsOverflow = textWidth > wrapperWidth

      setIsOverflow(nextIsOverflow)

      if (!nextIsOverflow) {
        setMarqueeShift(0)
        setAnimationDuration(DEFAULT_ANIMATION_DURATION)
        return
      }

      const nextShift = textWidth + MARQUEE_GAP

      setMarqueeShift(nextShift)
      setAnimationDuration(Math.max(10, nextShift / 60))
    }

    measure()

    const textWrapperNode = textWrapperRef.current
    const textLineNode = textLineRef.current

    if (typeof ResizeObserver !== 'undefined' && textWrapperNode && textLineNode) {
      const observer = new ResizeObserver(measure)

      observer.observe(textWrapperNode)
      observer.observe(textLineNode)

      return () => observer.disconnect()
    }

    window.addEventListener('resize', measure)

    return () => window.removeEventListener('resize', measure)
  }, [sanitizedContent])

  if (!popupInfo) return null

  const hideBanner = () => {
    removeAllPopupByType(PopupType.TOP_BAR)

    trackingHandler(TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_CLOSE_POPUP, { message_title: name })
  }

  const onClickCta = () => {
    navigate(ctaUrl)
    hideBanner()

    trackingHandler(TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_CTA_POPUP, {
      announcement_title: name,
      announcement_type: PopupType.TOP_BAR,
    })
  }

  const marqueeText = (
    <div
      ref={textWrapperRef}
      className="flex min-w-0 max-w-[min(860px,calc(100vw-320px))] flex-[0_1_auto] items-center overflow-hidden text-[#ffffffeb] max-sm:max-w-[calc(100vw-84px)] max-sm:flex-1"
    >
      <div
        className={cn(
          'flex w-max items-center whitespace-nowrap text-sm font-normal leading-6 text-[#ffffffeb]',
          isOverflow ? 'animate-[ks-top-banner-marquee_var(--ks-marquee-duration)_linear_infinite] gap-8' : 'gap-0',
        )}
        style={
          {
            '--ks-marquee-shift': `${marqueeShift}px`,
            '--ks-marquee-duration': `${animationDuration}s`,
          } as React.CSSProperties
        }
      >
        <div
          ref={textLineRef}
          className="shrink-0 whitespace-nowrap [&>*]:m-0 [&>*]:whitespace-nowrap"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {isOverflow && (
          <div
            aria-hidden="true"
            className="shrink-0 whitespace-nowrap [&>*]:m-0 [&>*]:whitespace-nowrap"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        )}
      </div>
    </div>
  )

  const joinButton = hasCta ? (
    <CtaButton
      color="outline"
      data={primaryCta}
      onClick={onClickCta}
      className="ks-top-banner-join-btn ml-2 h-7 w-fit min-w-[108px] whitespace-nowrap !border-[#1dd8a4d9] bg-transparent px-3 text-[13px] font-medium !text-[#1dd8a4] max-sm:ml-0 max-sm:w-full"
    />
  ) : null

  return (
    <div className="w-full border-b border-white-08 bg-[linear-gradient(90deg,#12372b_0%,#113126_100%)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-6 py-2 max-sm:flex max-sm:flex-col max-sm:items-stretch max-sm:gap-2 max-sm:px-3">
        {!isMobile && <div className="size-6" />}

        <div className="flex min-w-0 items-center justify-center gap-2 justify-self-center max-sm:w-full max-sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 max-sm:flex-1">
            <div className="flex shrink-0 items-center">
              <Announcement style={{ minWidth: ICON_SIZE }} />
            </div>

            {marqueeText}
          </div>

          {!isMobile && joinButton}
          {isMobile && (
            <X
              onClick={hideBanner}
              size={20}
              className="shrink-0 cursor-pointer justify-self-end text-white-60 hover:text-[#ffffffe6]"
            />
          )}
        </div>

        {!isMobile && (
          <X
            onClick={hideBanner}
            size={20}
            className="shrink-0 cursor-pointer justify-self-end text-white-60 hover:text-[#ffffffe6]"
          />
        )}
        {isMobile && joinButton}
      </div>
    </div>
  )
}

export default TopBanner
