import { Trans } from '@lingui/macro'

import { ReactComponent as AlarmIcon } from 'assets/svg/alarm.svg'
import AlertCondition, { AlertConditionData } from 'pages/NotificationCenter/PriceAlerts/AlertCondition'
import { PriceAlert } from 'pages/NotificationCenter/const'

type Props = {
  renderToggle?: () => React.ReactNode
  renderDeleteButton?: () => React.ReactNode
  timeText?: React.ReactNode
  isHistorical?: boolean
  alertData: Pick<PriceAlert, 'note'> & Partial<Pick<PriceAlert, 'disableAfterTrigger'>> & AlertConditionData
  onClick?: () => void
}
const CommonSingleAlert: React.FC<Props> = ({
  renderToggle,
  renderDeleteButton,
  timeText,
  isHistorical = false,
  alertData,
  onClick,
}) => {
  if (!alertData) return null
  const { note, disableAfterTrigger } = alertData
  return (
    <div
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'unset' }}
      className="flex flex-col gap-3 border-b border-solid border-border py-5 last:border-0 max-md:py-4"
    >
      <div className="flex h-6 items-center justify-between">
        <div className="flex items-center gap-1 text-sm font-medium text-subText">
          <AlarmIcon width={16} height={16} />
          <span>
            <Trans>Price Alert</Trans>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {renderToggle?.()}
          {renderDeleteButton?.()}
        </div>
      </div>

      <div className="flex flex-row flex-wrap gap-4 max-md:flex-col-reverse max-md:gap-3">
        <AlertCondition alertData={alertData} shouldIncludePrefix={!isHistorical} />
        <span className="flex-[0_0_max-content] whitespace-nowrap text-xs leading-5 text-subText">{timeText}</span>
      </div>

      {note || alertData.disableAfterTrigger ? (
        <div className="flex flex-row flex-wrap justify-between gap-x-4 gap-y-3 whitespace-nowrap text-xs leading-4 text-subText max-md:flex-col [&_.empty-supplementary]:max-md:hidden">
          {note ? (
            <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">
              <Trans>Note</Trans>: {note}
            </span>
          ) : (
            <span className="empty-supplementary" />
          )}

          {disableAfterTrigger ? (
            <span className="whitespace-nowrap">
              <Trans>This alert will be disabled after its triggered once</Trans>
            </span>
          ) : (
            <span className="empty-supplementary" />
          )}
        </div>
      ) : null}
    </div>
  )
}

export default CommonSingleAlert
