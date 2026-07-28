import { Trans } from '@lingui/macro'

import NotificationImage from 'assets/images/notification_default.png'
import CtaButton from 'components/Announcement/Popups/CtaButton'
import {
  AnnouncementTemplatePopup,
  PopupContentAnnouncement,
  PopupItemType,
  PopupType,
} from 'components/Announcement/type'
import { AutoColumn } from 'components/Column'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useRemovePopup } from 'state/application/hooks'
import { cn } from 'utils/cn'
import { useNavigateToUrl } from 'utils/redirect'

export default function SnippetPopupItem({
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
    <div className="relative flex h-[124px] rounded-lg bg-tableHeader/95">
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
        <div className={cn('relative flex items-end gap-3', hasCta ? 'justify-between' : 'justify-start')}>
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
