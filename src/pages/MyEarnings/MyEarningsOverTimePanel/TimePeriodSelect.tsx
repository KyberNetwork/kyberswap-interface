import styled from 'styled-components'

import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

export const timePeriods = ['7D', '1M', '6M', '1Y'] as const
export type TimePeriod = typeof timePeriods[number]

const Wrapper = styled.div`
  width: 100%;

  display: grid;
  grid-template-columns: repeat(${timePeriods.length}, 1fr);

  padding: 2px;
  gap: 2px;

  border-radius: 20px;
  background: ${({ theme }) => theme.buttonBlack};
`

const TimeButton = styled.div<{ active?: boolean }>`
  width: 100%;
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
  const { mixpanelHandler } = useMixpanel()

  return (
    <Wrapper>
      {timePeriods.map(period => {
        return (
          <TimeButton
            key={period}
            role="button"
            onClick={() => {
              mixpanelHandler(MIXPANEL_TYPE.EARNING_DASHBOARD_CLICK_CHANGE_TIMEFRAME_EARNING_CHART)
              setPeriod(period)
            }}
            active={period === selectedPeriod}
          >
            {period}
          </TimeButton>
        )
      })}
    </Wrapper>
  )
}

export default TimePeriodSelect
