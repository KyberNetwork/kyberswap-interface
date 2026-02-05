import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import styled from 'styled-components'

const WarningMessage = styled.div`
  background-color: ${({ theme }) => rgba(theme.warning, 0.1)};
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  text-align: left;
  padding: 8px 12px;
  border-radius: 16px;
  width: fit-content;
  max-width: 100%;
`

export default function Warning({
  deadlineBeforeConditionTime,
  timeBeforeNow,
  isGasTooHigh,
  orWithTimeAlreadyMet,
  conditionTime,
}: {
  deadlineBeforeConditionTime: boolean
  timeBeforeNow: boolean
  isGasTooHigh: boolean
  orWithTimeAlreadyMet: boolean
  conditionTime?: string
}) {
  return (
    <>
      {timeBeforeNow && (
        <WarningMessage>
          <Trans>Trigger time must be in the future. Adjust the time settings accordingly.</Trans>
        </WarningMessage>
      )}
      {deadlineBeforeConditionTime && (
        <WarningMessage>
          <Trans>Trigger time must be before the order expires. Adjust the time settings accordingly.</Trans>
        </WarningMessage>
      )}
      {isGasTooHigh && (
        <WarningMessage>
          <Trans>Max fee is capped at 100% for safety.</Trans>
        </WarningMessage>
      )}
      {orWithTimeAlreadyMet && conditionTime && (
        <WarningMessage>
          <Trans>
            This will likely execute immediately. &ldquo;Before {conditionTime}&rdquo; is already met. If you want both
            conditions to be required, switch to AND.
          </Trans>
        </WarningMessage>
      )}
    </>
  )
}
