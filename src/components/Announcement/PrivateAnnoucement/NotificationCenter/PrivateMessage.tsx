import { Flex } from 'rebass'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { AnnouncementTemplatePopup } from 'components/Announcement/type'
import { formatTime } from 'utils/time'

import { Desc, Time, Title, Wrapper } from './styled'

export default function AnnouncementItem({
  announcement,
  title,
}: PrivateAnnouncementPropCenter<AnnouncementTemplatePopup>) {
  const { sentAt, templateType, templateBody } = announcement

  return (
    <Wrapper>
      <Flex justifyContent="space-between" width="100%">
        <Title>
          <InboxIcon type={templateType} />
          {title}
        </Title>
        <Flex alignItems={'center'}>
          <Time>{formatTime(sentAt)} </Time>
        </Flex>
      </Flex>
      <Desc>{templateBody.content}</Desc>
    </Wrapper>
  )
}
