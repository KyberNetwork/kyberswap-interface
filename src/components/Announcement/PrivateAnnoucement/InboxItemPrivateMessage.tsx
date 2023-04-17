import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import {
  Dot,
  InboxItemRow,
  InboxItemWrapper,
  PrimaryText,
  RowItem,
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplatePopup } from 'components/Announcement/type'

function InboxItemBridge({
  announcement,
  onRead,
  style,
  time,
  title,
}: PrivateAnnouncementProp<AnnouncementTemplatePopup>) {
  const { templateBody, isRead, templateType } = announcement

  const onClick = () => {
    onRead(announcement, 'private_msg')
  }

  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxItemRow>
        <RowItem>
          <InboxIcon type={templateType} />
          <Title isRead={isRead}>{title}</Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem></RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <PrimaryText>{templateBody.content}</PrimaryText>
      </InboxItemRow>

      <InboxItemRow>
        <div />
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
