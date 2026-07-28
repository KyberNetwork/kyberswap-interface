import { Trans } from '@lingui/macro'

export default function Warning({
  deadlineBeforeConditionTime,
  timeBeforeNow,
  isGasTooHigh,
}: {
  deadlineBeforeConditionTime: boolean
  timeBeforeNow: boolean
  isGasTooHigh: boolean
}) {
  const warningClass = 'w-fit max-w-full rounded-2xl bg-warning-10 px-3 py-2 text-left text-xs text-subText'
  return (
    <>
      {timeBeforeNow && (
        <div className={warningClass}>
          <Trans>Trigger time must be in the future. Adjust the time settings accordingly.</Trans>
        </div>
      )}
      {deadlineBeforeConditionTime && (
        <div className={warningClass}>
          <Trans>Trigger time must be before the order expires. Adjust the time settings accordingly.</Trans>
        </div>
      )}
      {isGasTooHigh && (
        <div className={warningClass}>
          <Trans>Max fee is capped at 100% for safety.</Trans>
        </div>
      )}
    </>
  )
}

export function OrTimeAlreadyMetWarning({ conditionTime }: { conditionTime: string }) {
  return (
    <div className="w-fit max-w-full rounded-2xl bg-warning-10 px-3 py-2 text-left text-sm leading-5">
      <span className="text-warning">
        <Trans>This will likely execute immediately.</Trans>
      </span>
      <br />
      <span className="text-subText">
        <Trans>{conditionTime} is already met.</Trans>
      </span>
      <br />
      <span className="text-subText">
        <Trans>If you want both conditions to be required, switch to AND.</Trans>
      </span>
    </div>
  )
}
