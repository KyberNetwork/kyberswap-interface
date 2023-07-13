import { Flex } from 'rebass'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { useNavigateToUrl } from 'components/Announcement/helper'
import { AnnouncementTemplatePopup } from 'components/Announcement/type'
import { escapeScriptHtml } from 'utils/string'
import { formatTime } from 'utils/time'

import { Desc, Time, Title, Wrapper } from './styled'

export default function AnnouncementItem({
  announcement,
  title,
}: PrivateAnnouncementPropCenter<AnnouncementTemplatePopup>) {
  const { sentAt, templateType, templateBody } = announcement
  const { ctaURL } = templateBody || {}
  const navigate = useNavigateToUrl()

  return (
    <Wrapper onClick={() => navigate(ctaURL)}>
      <Flex justifyContent="space-between" width="100%">
        <Title>
          <InboxIcon type={templateType} />
          {title}
        </Title>
        <Flex alignItems={'center'}>
          <Time>{formatTime(sentAt)} </Time>
        </Flex>
      </Flex>
      <Desc
        dangerouslySetInnerHTML={{ __html: escapeScriptHtml(templateBody.content ?? '') }}
        style={{ lineHeight: '18px' }}
      />
    </Wrapper>
  )
}
