import { Trans } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { Flex } from 'rebass'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { TokenInfo } from 'components/Announcement/PrivateAnnoucement/InboxItemTrendingSoon'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { AnnouncementTemplateTrendingSoon } from 'components/Announcement/type'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { formatTime } from 'utils/time'

import { Desc, Time, Title, Wrapper } from './styled'

export default function AnnouncementItem({
  announcement,
  title,
}: PrivateAnnouncementPropCenter<AnnouncementTemplateTrendingSoon>) {
  const { sentAt, templateType, templateBody } = announcement
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <Wrapper onClick={() => navigate(APP_PATHS.KYBERAI_RANKINGS)}>
      <Flex justifyContent="space-between" width="100%">
        <Title>
          <InboxIcon type={templateType} />
          {title}
        </Title>
        <Flex alignItems={'center'}>
          <Time>{formatTime(sentAt)} </Time>
        </Flex>
      </Flex>
      <Desc style={{ gap: 6, flexWrap: 'wrap', color: theme.subText }}>
        <Trans>Here are our top tokens by KyberAI</Trans>
        <TokenInfo templateBody={templateBody} type="bullish" />,
        <TokenInfo templateBody={templateBody} type="bearish" />,
        <TokenInfo templateBody={templateBody} type="trending" />
      </Desc>
    </Wrapper>
  )
}
