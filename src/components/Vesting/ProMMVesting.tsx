import React from 'react'
import { usePrommSchedules } from 'state/vesting/hooks'
import { Text, Flex } from 'rebass'
import { Trans, t } from '@lingui/macro'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import AgriCulture from 'components/Icons/AgriCulture'
import { MouseoverTooltip } from 'components/Tooltip'
import ScheduleCard from './ScheduleCard'

const SummaryWrapper = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  margin-top: 32px;
`

const SummaryItem = styled.div`
  border-radius: 8px;
  background: ${({ theme }) => theme.background};
  padding: 20px 20px 24px;
`
const SummaryItemTitle = styled.div`
  border-bottom: 1px dashed ${({ theme }) => theme.border};
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
`
const ScheduleGrid = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr 1fr 1fr;
  margin-top: 16px;
`

const ProMMVesting = () => {
  const theme = useTheme()
  const { loading, schedulesByRewardLocker } = usePrommSchedules()
  console.log(schedulesByRewardLocker)
  return (
    <>
      <Text fontWeight={500} fontSize="1rem">
        <Trans>Summary</Trans>
      </Text>

      <SummaryWrapper>
        <SummaryItem>
          <Flex justifyContent="space-between" alignItems="center">
            <MouseoverTooltip
              text={t`The total amount of rewards you have harvested from the farms. Harvested rewards are locked initially and vested linearly over a short period.`}
            >
              <SummaryItemTitle>
                <Trans>Total Harvested Rewards</Trans>
              </SummaryItemTitle>
            </MouseoverTooltip>
            <AgriCulture color={theme.subText} />
          </Flex>

          <Flex marginTop="24px" alignItems="center" justifyContent="space-between">
            <Text fontWeight={500} fontSize={24}>
              $600.000
            </Text>
          </Flex>
        </SummaryItem>
      </SummaryWrapper>

      <Text fontSize={16} fontWeight="500" marginTop="24px">
        <Trans>Vesting Schedules</Trans>
      </Text>

      <ScheduleGrid>
        {Object.keys(schedulesByRewardLocker).map(rewardLocker => {
          return <ScheduleCard key={rewardLocker} schedules={schedulesByRewardLocker[rewardLocker]} />
        })}
      </ScheduleGrid>
    </>
  )
}

export default ProMMVesting
