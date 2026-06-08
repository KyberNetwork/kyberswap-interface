import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import InboxActions from 'components/Announcement/PrivateAnnoucement/InboxActions'
import { Dot, InboxItemRow, InboxItemWrapper, RowItem, Title } from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplatePopup } from 'components/Announcement/type'
import { useNavigateToUrl } from 'utils/redirect'
import { escapeScriptHtml } from 'utils/string'

function InboxItemBridge({
  announcement,
  onRead,
  style,
  time,
  title,
  onPin,
  onDelete,
}: PrivateAnnouncementProp<AnnouncementTemplatePopup>) {
  const { templateBody, isRead, templateType } = announcement
  const { ctaURL } = templateBody || {}
  const navigate = useNavigateToUrl()
  const onClick = () => {
    navigate(ctaURL)
    onRead(announcement, 'private_msg')
  }

  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxActions
        isPinned={announcement.isPinned}
        onPin={onPin ? () => onPin(announcement) : undefined}
        onDelete={onDelete ? () => onDelete(announcement) : undefined}
      />
      <InboxItemRow>
        <RowItem>
          <InboxIcon type={templateType} />
          <Title isRead={isRead}>{title}</Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem></RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <div
          className="block h-[34px] max-w-full overflow-hidden text-ellipsis break-words text-xs leading-4 text-subText [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box] [&>*]:m-0"
          dangerouslySetInnerHTML={{ __html: escapeScriptHtml(templateBody.content ?? '') }}
        />
      </InboxItemRow>

      <InboxItemRow>
        <div />
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
