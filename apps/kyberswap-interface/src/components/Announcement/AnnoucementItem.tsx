import { CSSProperties } from 'react'

import NotificationImage from 'assets/images/notification_default.png'
import { Announcement } from 'components/Announcement/type'
import { cn } from 'utils/cn'
import { escapeScriptHtml } from 'utils/string'
import { formatTime } from 'utils/time'

const HEIGHT = '92px'

export default function AnnouncementItem({
  announcement,
  onRead,
  style,
}: {
  announcement: Announcement
  onRead: () => void
  style: CSSProperties
}) {
  const { templateBody, isRead } = announcement

  const { name, startAt, content, thumbnailImageURL } = templateBody
  return (
    <div
      onClick={onRead}
      style={style}
      className={cn(
        'flex cursor-pointer items-start gap-3.5 border-b border-solid border-border bg-background px-5 py-4 text-xs',
        isRead ? 'hover:bg-buttonBlack' : 'bg-primary-10 hover:bg-primary-12',
      )}
    >
      <img
        src={thumbnailImageURL || NotificationImage}
        className="max-h-[92px] w-[140px] rounded-lg [object-fit:scale-down]"
      />
      <div
        className="flex flex-1 flex-col items-start justify-between gap-1.5 overflow-hidden"
        style={{ height: HEIGHT, maxHeight: '100%', maxWidth: '100%' }}
      >
        <div className="flex w-full items-center gap-2">
          <div
            className={cn(
              'w-full overflow-hidden truncate whitespace-nowrap text-xs font-medium',
              isRead ? 'text-text' : 'text-primary',
            )}
          >
            {name}
          </div>
          {!isRead && <span className="size-2 shrink-0 grow-0 basis-2 rounded-full bg-primary" />}
        </div>
        <div
          dangerouslySetInnerHTML={{ __html: escapeScriptHtml(content) }}
          className="h-[34px] max-w-full overflow-hidden text-ellipsis text-xs leading-4 text-subText [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box] [&>*]:m-0"
        />
        <span className="w-full text-right text-subText">{formatTime(startAt)}</span>
      </div>
    </div>
  )
}
