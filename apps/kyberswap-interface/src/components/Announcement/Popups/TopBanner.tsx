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

const MARQUEE_GAP = 32

const BannerWrapper = styled.div`
  width: 100%;
  background: linear-gradient(90deg, #12372b 0%, #113126 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`

const BannerInner = styled.div`
  padding: 8px 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 8px 12px;
    gap: 8px;
  `}
`

const CloseButton = styled(X)`
  justify-self: end;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  flex-shrink: 0;
  :hover {
    color: rgba(255, 255, 255, 0.9);
  }
`

const DesktopSpacer = styled.div`
  width: 24px;
  height: 24px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

const PrimaryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
`

const Content = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  justify-self: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: space-between;
    width: 100%;
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
  flex: 0 1 auto;
  max-width: min(860px, calc(100vw - 320px));
  min-width: 0;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.92);

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
  width: max-content;
  gap: ${({ $isOverflow }) => ($isOverflow ? `${MARQUEE_GAP}px` : '0')};
  line-height: 24px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  font-weight: 400;
  white-space: nowrap;
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
  width: fit-content;
  min-width: 108px;
  height: 28px;
  padding: 0 12px;
  margin-left: 8px;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  color: #1dd8a4;
  border-color: rgba(29, 216, 164, 0.85);
  background: transparent;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-left: 0;
    width: 100%;
  `}
`

function TopBanner() {
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { topPopups } = useActivePopups()
  const textWrapperRef = useRef<HTMLDivElement>(null)
  const textLineRef = useRef<HTMLDivElement>(null)
  const [isOverflow, setIsOverflow] = useState(false)
  const [animationDuration, setAnimationDuration] = useState(12)
  const [marqueeShift, setMarqueeShift] = useState(0)
  const popupInfo = topPopups[topPopups.length - 1]
  const { trackingHandler } = useTracking()

  const removeAllPopupByType = useRemoveAllPopupByType()

  const navigate = useNavigateToUrl()
  const templateBody = popupInfo?.content.templateBody as AnnouncementTemplatePopup | undefined
  const content = templateBody?.content ?? ''
  const ctas = templateBody?.ctas ?? []
  const name = templateBody?.name ?? ''
  const ctaUrl = ctas[0]?.url
  const ctaName = ctas[0]?.name
  const sanitizedContent = useMemo(
    () => escapeScriptHtml(isMobile ? content.replace(/<br\/>/g, '&nbsp;') : content),
    [content, isMobile],
  )

  useEffect(() => {
    const measure = () => {
      const wrapperNode = textWrapperRef.current
      const textLineNode = textLineRef.current
      if (!wrapperNode || !textLineNode) return

      const wrapperWidth = wrapperNode.clientWidth
      const textWidth = textLineNode.scrollWidth
      const nextIsOverflow = textWidth > wrapperWidth

      setIsOverflow(nextIsOverflow)
      if (!nextIsOverflow) {
        setMarqueeShift(0)
        setAnimationDuration(12)
        return
      }

      const nextShift = textWidth + MARQUEE_GAP
      setMarqueeShift(nextShift)
      setAnimationDuration(Math.max(10, nextShift / 60))
    }

    measure()

    const wrapperNode = textWrapperRef.current
    const textLineNode = textLineRef.current
    if (typeof ResizeObserver !== 'undefined' && wrapperNode && textLineNode) {
      const observer = new ResizeObserver(measure)
      observer.observe(wrapperNode)
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
      announcement_type: PopupType.TOP_BAR,
      announcement_title: name,
    })
  }

  if (!isMobile) {
    return (
      <BannerWrapper>
        <BannerInner>
          <DesktopSpacer />
          <Content>
            <LeadingIcon>
              <Announcement style={{ minWidth: '24px' }} />
            </LeadingIcon>
            <TextWrapper ref={textWrapperRef}>
              <TextContent
                $animationDuration={animationDuration}
                $isOverflow={isOverflow}
                style={{ ['--marquee-shift' as string]: `${marqueeShift}px` }}
              >
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
            {ctaName && ctaUrl && <JoinButton data={ctas[0]} color="outline" onClick={onClickCta} />}
          </Content>
          <CloseButton size={20} onClick={hideBanner} />
        </BannerInner>
      </BannerWrapper>
    )
  }

  return (
    <BannerWrapper>
      <BannerInner>
        <Content>
          <PrimaryRow>
            <LeadingIcon>
              <Announcement style={{ minWidth: '24px' }} />
            </LeadingIcon>
            <TextWrapper ref={textWrapperRef}>
              <TextContent
                $animationDuration={animationDuration}
                $isOverflow={isOverflow}
                style={{ ['--marquee-shift' as string]: `${marqueeShift}px` }}
              >
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
          </PrimaryRow>
          <CloseButton size={20} onClick={hideBanner} />
        </Content>
        {ctaName && ctaUrl && <JoinButton data={ctas[0]} color="outline" onClick={onClickCta} />}
      </BannerInner>
    </BannerWrapper>
  )
}

export default TopBanner
