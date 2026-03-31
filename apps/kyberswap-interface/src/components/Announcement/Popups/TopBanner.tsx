import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import styled, { css, keyframes } from 'styled-components'

import CtaButton from 'components/Announcement/Popups/CtaButton'
import { AnnouncementTemplatePopup, PopupType } from 'components/Announcement/type'
import Announcement from 'components/Icons/Announcement'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useActivePopups, useRemoveAllPopupByType } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { useNavigateToUrl } from 'utils/redirect'
import { escapeScriptHtml } from 'utils/string'

const DEFAULT_ANIMATION_DURATION = 12
const ICON_SIZE = 24
const MARQUEE_GAP = 32

const BannerWrapper = styled.div`
  width: 100%;
  background: linear-gradient(90deg, #12372b 0%, #113126 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`

const BannerInner = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 8px 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: flex;
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    padding: 8px 12px;
  `}
`

const CloseButton = styled(X)`
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  flex-shrink: 0;
  justify-self: end;

  :hover {
    color: rgba(255, 255, 255, 0.9);
  }
`

const DesktopSpacer = styled.div`
  width: ${ICON_SIZE}px;
  height: ${ICON_SIZE}px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

const Content = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  justify-self: center;
  min-width: 0;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    justify-content: space-between;
  `}
`

const MainRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1;
  `}
`

const LeadingIcon = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`

const TextWrapper = styled.div`
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.92);
  flex: 0 1 auto;
  max-width: min(860px, calc(100vw - 320px));
  min-width: 0;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1;
    max-width: calc(100vw - 84px);
  `}
`

const marquee = keyframes`
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(calc(-1 * var(--marquee-shift, 0px)));
  }
`

const TextContent = styled.div<{ $isOverflow: boolean; $animationDuration: number }>`
  display: flex;
  align-items: center;
  gap: ${({ $isOverflow }) => ($isOverflow ? `${MARQUEE_GAP}px` : '0')};
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  white-space: nowrap;
  width: max-content;

  ${({ $isOverflow, $animationDuration }) =>
    $isOverflow &&
    css`
      animation: ${marquee} ${$animationDuration}s linear infinite;
    `}
`

const TextLine = styled.div`
  flex-shrink: 0;
  white-space: nowrap;

  > * {
    margin: 0;
    white-space: nowrap;
  }
`

const JoinButton = styled(CtaButton)`
  background: transparent;
  border-color: rgba(29, 216, 164, 0.85);
  color: #1dd8a4;
  font-size: 13px;
  font-weight: 500;
  height: 28px;
  margin-left: 8px;
  min-width: 108px;
  padding: 0 12px;
  white-space: nowrap;
  width: fit-content;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-left: 0;
    width: 100%;
  `}
`

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

  const marqueeStyle = { ['--marquee-shift' as string]: `${marqueeShift}px` }

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
    <TextWrapper ref={textWrapperRef}>
      <TextContent $animationDuration={animationDuration} $isOverflow={isOverflow} style={marqueeStyle}>
        <TextLine
          ref={textLineRef}
          dangerouslySetInnerHTML={{
            __html: sanitizedContent,
          }}
        />

        {isOverflow && (
          <TextLine
            aria-hidden="true"
            dangerouslySetInnerHTML={{
              __html: sanitizedContent,
            }}
          />
        )}
      </TextContent>
    </TextWrapper>
  )

  return (
    <BannerWrapper>
      <BannerInner>
        {!isMobile && <DesktopSpacer />}

        <Content>
          <MainRow>
            <LeadingIcon>
              <Announcement style={{ minWidth: ICON_SIZE }} />
            </LeadingIcon>

            {marqueeText}
          </MainRow>

          {!isMobile && hasCta && <JoinButton color="outline" data={primaryCta} onClick={onClickCta} />}
          {isMobile && <CloseButton onClick={hideBanner} size={20} />}
        </Content>

        {!isMobile && <CloseButton onClick={hideBanner} size={20} />}
        {isMobile && hasCta && <JoinButton color="outline" data={primaryCta} onClick={onClickCta} />}
      </BannerInner>
    </BannerWrapper>
  )
}

export default TopBanner
