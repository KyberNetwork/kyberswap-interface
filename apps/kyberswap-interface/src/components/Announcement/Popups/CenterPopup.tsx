import { t } from '@lingui/macro'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import styled, { css } from 'styled-components'

import CtaButton from 'components/Announcement/Popups/CtaButton'
import {
  AnnouncementTemplatePopup,
  PopupContentAnnouncement,
  PopupItemType,
  PopupType,
} from 'components/Announcement/type'
import Column from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { Z_INDEXS } from 'constants/styles'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { useNavigateToUrl, validateRedirectURL } from 'utils/redirect'
import { escapeScriptHtml } from 'utils/string'

const Wrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-height: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 20px;
    padding: 20px;
  `}
`
const ContentWrapper = styled.div<{ isVertical: boolean }>`
  display: flex;
  overflow-x: hidden;
  gap: 24px;
  flex: 1;
  max-width: 100%;
  ${({ isVertical }) =>
    isVertical
      ? css`
          flex-direction: column;
          overflow-y: auto;
        `
      : css`
          flex-direction: row;
          gap: 24px;
          overflow-y: hidden;
        `}
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 20px;
  `}
  a:focus-visible {
    outline: none;
  }
`

const Title = styled.div`
  font-weight: 500;
  font-size: 20px;
  line-height: 24px;
  word-break: break-word;
`

const ButtonWrapper = styled(Row)`
  gap: 24px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 12px;
  `}
`

const Image = styled.img`
  border-radius: 20px;
  max-height: 50vh;
  width: 100%;
  object-fit: contain;
  margin: auto;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-height: unset;
  `}
`

const StyledCtaButton = styled(CtaButton)`
  width: fit-content;
  min-width: min(220px, 100%);
  max-width: 100%;
  height: 36px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: fit-content;
    min-width: 100px;
    max-width: 100%;
  `}
`

const Desc = styled.div`
  word-break: break-word;
  font-size: 14px;
  line-height: 20px;
  &::-webkit-scrollbar {
    display: block;
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
  }
`

const VIDEO_SIZE = `360px`
const VideoWrapper = styled.div`
  width: 640px;
  height: ${VIDEO_SIZE};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 100%;
  `}
`

const whitelistDomains = ['drive.google.com', 'www.youtube.com']
const Video = ({ url, title }: { url: string; title: string }) => {
  try {
    const { host } = new URL(url)
    if (!whitelistDomains.includes(host) || !validateRedirectURL(url, { _dangerousSkipCheckWhitelist: true }))
      return null
  } catch (error) {
    return null
  }
  return (
    <VideoWrapper>
      <iframe
        width="100%"
        height="100%"
        src={url}
        frameBorder="0"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </VideoWrapper>
  )
}

export default function CenterPopup({
  onDismiss,
  data,
}: {
  onDismiss: () => void
  data: PopupItemType<PopupContentAnnouncement>
}) {
  const theme = useTheme()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { mixpanelHandler } = useMixpanel()

  const { templateBody = {} } = data.content
  const {
    name = t`Important Announcement!`,
    content,
    ctas = [],
    thumbnailImageURL,
    thumbnailVideoURL,
  } = templateBody as AnnouncementTemplatePopup

  const navigate = useNavigateToUrl()
  const trackingClose = () => mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CLOSE_POPUP, { message_title: name })

  const onClickCta = (ctaUrl?: string) => {
    onDismiss()
    ctaUrl && navigate(ctaUrl)
    mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CTA_POPUP, {
      announcement_type: PopupType.CENTER,
      announcement_title: name,
    })
  }

  const isVertical = !!thumbnailVideoURL && !isMobile

  const renderContent = () => (
    <>
      <Desc
        dangerouslySetInnerHTML={{ __html: escapeScriptHtml(content) }}
        style={{ overflowY: isVertical ? 'auto' : undefined }}
      />
      <ButtonWrapper justify="center">
        {ctas.length > 0 ? (
          ctas.map(item => (
            <StyledCtaButton
              key={item.url}
              data={item}
              color="primary"
              onClick={() => {
                onClickCta(item.url)
              }}
            />
          ))
        ) : (
          <StyledCtaButton data={{ name: t`Close`, url: '' }} color="primary" onClick={() => onClickCta()} />
        )}
      </ButtonWrapper>
    </>
  )

  return (
    <Modal
      isOpen={true}
      maxWidth={isMobile ? undefined : isVertical ? '100vw' : '800px'}
      width={isVertical ? '1024px' : undefined}
      onDismiss={onDismiss}
      zindex={Z_INDEXS.MODAL}
    >
      <Wrapper>
        <RowBetween align="center">
          <Title>{name}</Title>
          <X
            cursor={'pointer'}
            color={theme.subText}
            onClick={() => {
              onDismiss()
              trackingClose()
            }}
            style={{ minWidth: '24px' }}
          />
        </RowBetween>
        <ContentWrapper isVertical={!isVertical}>
          {thumbnailVideoURL ? (
            <Video url={thumbnailVideoURL} title={name} />
          ) : (
            thumbnailImageURL && <Image src={thumbnailImageURL} />
          )}
          {isVertical ? (
            <Column width={'320px'} height={VIDEO_SIZE} gap="14px" justifyContent={'space-between'}>
              {renderContent()}
            </Column>
          ) : (
            renderContent()
          )}
        </ContentWrapper>
      </Wrapper>
    </Modal>
  )
}
