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

const OrTimeWarning = styled.div`
  background-color: ${({ theme }) => rgba(theme.warning, 0.1)};
  font-size: 14px;
  text-align: left;
  padding: 8px 12px;
  border-radius: 16px;
  line-height: 20px;
  width: fit-content;
  max-width: 100%;
`

const WarningText = styled.span`
  color: ${({ theme }) => theme.warning};
`

const NormalText = styled.span`
  color: ${({ theme }) => theme.subText};
`

export default function Warning({
  deadlineBeforeConditionTime,
  timeBeforeNow,
  isGasTooHigh,
}: {
  deadlineBeforeConditionTime: boolean
  timeBeforeNow: boolean
  isGasTooHigh: boolean
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
    </>
  )
}

export function OrTimeAlreadyMetWarning({ conditionTime }: { conditionTime: string }) {
  return (
    <OrTimeWarning>
      <WarningText>
        <Trans>This will likely execute immediately.</Trans>
      </WarningText>
      <br />
      <NormalText>
        <Trans>{conditionTime} is already met.</Trans>
      </NormalText>
      <br />
      <NormalText>
        <Trans>If you want both conditions to be required, switch to AND.</Trans>
      </NormalText>
    </OrTimeWarning>
  )
}
