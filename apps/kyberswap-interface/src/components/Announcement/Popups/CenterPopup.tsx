import { t } from '@lingui/macro'
import { X } from 'react-feather'
import { useMedia } from 'react-use'

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
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { useNavigateToUrl, validateRedirectURL } from 'utils/redirect'
import { escapeScriptHtml } from 'utils/string'

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
    <div className="h-[360px] w-[640px] max-sm:max-w-full">
      <iframe
        width="100%"
        height="100%"
        src={url}
        frameBorder="0"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

const CTA_BUTTON_CLASS = 'h-9 w-fit min-w-[min(220px,100%)] max-w-full max-sm:min-w-[100px]'

export default function CenterPopup({
  onDismiss,
  data,
}: {
  onDismiss: () => void
  data: PopupItemType<PopupContentAnnouncement>
}) {
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { trackingHandler } = useTracking()

  const { templateBody = {} } = data.content
  const {
    name = t`Important Announcement!`,
    content,
    ctas = [],
    thumbnailImageURL,
    thumbnailVideoURL,
  } = templateBody as AnnouncementTemplatePopup

  const navigate = useNavigateToUrl()
  const trackingClose = () =>
    trackingHandler(TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_CLOSE_POPUP, { message_title: name })

  const onClickCta = (ctaUrl?: string) => {
    onDismiss()
    ctaUrl && navigate(ctaUrl)
    trackingHandler(TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_CTA_POPUP, {
      announcement_type: PopupType.CENTER,
      announcement_title: name,
    })
  }

  const isVertical = !!thumbnailVideoURL && !isMobile

  const renderContent = () => (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: escapeScriptHtml(content) }}
        style={{ overflowY: isVertical ? 'auto' : undefined }}
        className="break-words text-sm leading-5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-1"
      />
      <Row className="justify-center gap-6 max-sm:gap-3">
        {ctas.length > 0 ? (
          ctas.map(item => (
            <CtaButton
              key={item.url}
              className={CTA_BUTTON_CLASS}
              data={item}
              color="primary"
              onClick={() => {
                onClickCta(item.url)
              }}
            />
          ))
        ) : (
          <CtaButton
            className={CTA_BUTTON_CLASS}
            data={{ name: t`Close`, url: '' }}
            color="primary"
            onClick={() => onClickCta()}
          />
        )}
      </Row>
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
      <div className="flex max-h-full w-full flex-col gap-6 p-6 max-md:gap-5 max-md:p-5">
        <RowBetween className="items-center">
          <span className="break-words text-xl font-medium leading-6">{name}</span>
          <X
            cursor={'pointer'}
            className="min-w-6 text-subText"
            onClick={() => {
              onDismiss()
              trackingClose()
            }}
          />
        </RowBetween>
        <div
          className={cn(
            'flex max-w-full flex-1 gap-6 overflow-x-hidden max-md:gap-5 [&_a:focus-visible]:outline-none',
            !isVertical ? 'flex-col overflow-y-auto' : 'flex-row overflow-y-hidden',
          )}
        >
          {thumbnailVideoURL ? (
            <Video url={thumbnailVideoURL} title={name} />
          ) : (
            thumbnailImageURL && (
              <img
                src={thumbnailImageURL}
                className="m-auto max-h-[50vh] w-full rounded-[20px] object-contain max-sm:max-h-none"
              />
            )
          )}
          {isVertical ? (
            <Column className="h-[360px] w-80 justify-between gap-[14px]">{renderContent()}</Column>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </Modal>
  )
}
