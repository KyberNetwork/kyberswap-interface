import styled from 'styled-components'

import { TimePeriod, timePeriods } from 'state/myEarnings/reducer'

const Wrapper = styled.div`
  display: flex;
  padding: 2px;
  gap: 2px;

  border-radius: 20px;
  background: ${({ theme }) => theme.buttonBlack};
`

const TimeButton = styled.div<{ active?: boolean }>`
  width: 40px;
  height: 24px;

  display: flex;
  justify-content: center;
  align-items: center;

  font-weight: 500;
  font-size: 12px;
  line-height: 16px;

  border-radius: 20px;
  cursor: pointer;

  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  background-color: ${({ theme, active }) => (active ? theme.tableHeader : '')}; ;
`

type Props = {
  period: TimePeriod
  setPeriod: (p: TimePeriod) => void
}

const TimePeriodSelect: React.FC<Props> = ({ period: selectedPeriod, setPeriod }) => {
  return (
    <Wrapper>
      {timePeriods.map(period => {
        return (
          <TimeButton key={period} role="button" onClick={() => setPeriod(period)} active={period === selectedPeriod}>
            {period}
          </TimeButton>
        )
      })}
    </Wrapper>
  )
}

export default TimePeriodSelect
