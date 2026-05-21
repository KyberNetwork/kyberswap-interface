import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { AnnouncementTemplatePopup } from 'components/Announcement/type'
import { useNavigateToUrl } from 'utils/redirect'
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
      <div className="flex w-full justify-between">
        <Title>
          <InboxIcon type={templateType} />
          {title}
        </Title>
        <div className="flex items-center">
          <Time>{formatTime(sentAt)} </Time>
        </div>
      </div>
      <Desc
        dangerouslySetInnerHTML={{ __html: escapeScriptHtml(templateBody.content ?? '') }}
        style={{ lineHeight: '18px' }}
      />
    </Wrapper>
  )
}
