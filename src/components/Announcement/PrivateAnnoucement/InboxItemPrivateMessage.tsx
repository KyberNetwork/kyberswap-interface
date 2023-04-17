import styled from 'styled-components'

import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { Dot, InboxItemRow, InboxItemWrapper, RowItem, Title } from 'components/Announcement/PrivateAnnoucement/styled'
import { useNavigateToUrl } from 'components/Announcement/helper'
import { AnnouncementTemplatePopup } from 'components/Announcement/type'
import { escapeScriptHtml } from 'utils/string'

const Desc = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  word-break: break-word;
  display: block;
  display: -webkit-box;
  max-width: 100%;
  line-height: 16px;
  height: 34px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  > * {
    margin: 0;
  }
`
function InboxItemBridge({
  announcement,
  onRead,
  style,
  time,
  title,
}: PrivateAnnouncementProp<AnnouncementTemplatePopup>) {
  const { templateBody, isRead, templateType } = announcement
  const { ctaURL } = templateBody
  const navigate = useNavigateToUrl()
  const onClick = () => {
    navigate(ctaURL)
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
        <Desc dangerouslySetInnerHTML={{ __html: escapeScriptHtml(templateBody.content ?? '') }} />
      </InboxItemRow>

      <InboxItemRow>
        <div />
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
