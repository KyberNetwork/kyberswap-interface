import { CSSProperties, useState } from 'react'
import { useMedia } from 'react-use'

import NotificationImage from 'assets/images/notification_default.png'
import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import CtaButton from 'components/Announcement/Popups/CtaButton'
import { formatCtaName } from 'components/Announcement/Popups/DetailAnnouncementPopup'
import { Announcement } from 'components/Announcement/type'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { useNavigateToUrl } from 'utils/redirect'
import { escapeScriptHtml } from 'utils/string'
import { formatTime } from 'utils/time'

const HEIGHT = '92px'

export default function AnnouncementItem({
  announcement,
  style,
}: {
  announcement: Announcement
  style?: CSSProperties
}) {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const [expand, setExpand] = useState(false)
  const { templateBody } = announcement

  const { name, startAt, content, thumbnailImageURL, ctaURL } = templateBody
  const ctaName = formatCtaName(templateBody.ctaName, ctaURL)
  const navigate = useNavigateToUrl()
  const onClickCta: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.stopPropagation()
    navigate(ctaURL)
  }
  return (
    <div
      onClick={() => setExpand(!expand)}
      style={style}
      className="flex cursor-pointer items-start gap-3.5 border-b border-solid border-border bg-background py-4 text-xs first:pt-0 last:border-0 max-md:first:py-4"
    >
      <img
        src={thumbnailImageURL || NotificationImage}
        className="max-h-[92px] w-[140px] rounded-lg [object-fit:scale-down]"
      />
      <div
        className="flex max-w-full flex-1 flex-col items-start justify-between gap-2.5 overflow-hidden"
        style={{
          height: HEIGHT,
          maxHeight: expand ? 'unset' : '100%',
          ...(expand && { height: 'auto' }),
        }}
      >
        <div className="flex w-full justify-between">
          <div className={cn('text-xs font-medium text-text', !expand && 'truncate')}>{name} </div>
          <div className="flex items-center">
            {!upToMedium && (
              <div className="w-full text-right text-subText max-md:text-[10px]">{formatTime(startAt)} </div>
            )}
            <div
              data-expanded={expand}
              className="flex size-5 items-center justify-center text-subText [&_svg]:transition-all [&_svg]:duration-150 [&_svg]:ease-in-out data-[expanded=true]:[&_svg]:rotate-180"
            >
              <DropdownSVG />
            </div>
          </div>
        </div>
        {upToMedium && <div className="w-full text-left text-subText max-md:text-[10px]">{formatTime(startAt)} </div>}
        <div
          dangerouslySetInnerHTML={{ __html: escapeScriptHtml(content) }}
          className={cn(
            'max-w-full break-words text-xs leading-4 text-subText',
            !expand &&
              'h-[34px] overflow-hidden text-ellipsis [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box] [&>*]:m-0',
            expand && 'block [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          )}
        />
        {expand && ctaName && ctaURL && (
          <CtaButton color="link" data={{ url: ctaURL, name: ctaName }} onClick={onClickCta} />
        )}
      </div>
    </div>
  )
}
