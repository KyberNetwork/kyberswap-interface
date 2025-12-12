import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import styled from 'styled-components'

const WarningMessage = styled.div`
  background-color: ${({ theme }) => rgba(theme.warning, 0.2)};
  color: ${({ theme }) => theme.warning};
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
}: {
  deadlineBeforeConditionTime: boolean
  timeBeforeNow: boolean
}) {
  return (
    <>
      {timeBeforeNow && (
        <WarningMessage>
          <Trans>Condition time must be in the future</Trans>
        </WarningMessage>
      )}
      {deadlineBeforeConditionTime && (
        <WarningMessage>
          <Trans>Expire time must be later than the condition time</Trans>
        </WarningMessage>
      )}
    </>
  )
}
