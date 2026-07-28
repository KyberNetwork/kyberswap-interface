import { Trans } from '@lingui/macro'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { getSwapUrlPriceAlert } from 'components/Announcement/PrivateAnnoucement/InboxItemPriceAlert'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { Desc, Time, Title, Wrapper } from 'components/Announcement/PrivateAnnoucement/NotificationCenter/styled'
import { AnnouncementTemplatePriceAlert } from 'components/Announcement/type'
import AlertCondition from 'pages/NotificationCenter/PriceAlerts/AlertCondition'
import { useNavigateToUrl } from 'utils/redirect'
import { formatTime } from 'utils/time'

const PriceAlertAnnouncement: React.FC<PrivateAnnouncementPropCenter<AnnouncementTemplatePriceAlert>> = ({
  announcement,
  title,
}) => {
  const { templateBody, sentAt, templateType } = announcement
  const { chainId, note } = templateBody?.alert || {}
  const navigate = useNavigateToUrl()
  const onClick = () => {
    navigate(getSwapUrlPriceAlert(templateBody.alert), Number(chainId))
  }
  return (
    <Wrapper onClick={onClick}>
      <div className="flex w-full justify-between">
        <Title>
          <InboxIcon type={templateType} chainId={Number(chainId)} />
          {title}
        </Title>
        <div className="flex items-center">
          <Time>{formatTime(sentAt)} </Time>
        </div>
      </div>
      <Desc>
        <AlertCondition alertData={templateBody.alert || {}} shouldIncludePrefix={true} />
        {note ? (
          <div className="flex flex-col flex-wrap justify-between gap-x-4 gap-y-3 whitespace-nowrap text-xs leading-4 text-subText md:flex-row">
            <span className="whitespace-break-spaces [overflow-wrap:anywhere]">
              <Trans>Note</Trans>: {note}
            </span>
          </div>
        ) : null}
      </Desc>
    </Wrapper>
  )
}

export default PriceAlertAnnouncement
