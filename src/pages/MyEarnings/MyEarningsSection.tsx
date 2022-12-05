import { Flex } from 'rebass'

import useGetEarningsBreakdown from 'hooks/myEarnings/useGetEarningsBreakdown'
import useGetEarningsOverTime from 'hooks/myEarnings/useGetEarningsOverTime'

import EarningsBreakdownPanel from './EarningsBreakdownPanel'
import MyEarningsOverTimePanel from './MyEarningsOverTimePanel'

const MyEarningsSection = () => {
  const earningsBreakdownState = useGetEarningsBreakdown()
  const earningsOverTimeState = useGetEarningsOverTime()

  return (
    <Flex
      sx={{
        gap: '24px',
      }}
    >
      <EarningsBreakdownPanel isLoading={earningsBreakdownState.isValidating} data={earningsBreakdownState.data} />
      <MyEarningsOverTimePanel isLoading={earningsOverTimeState.isValidating} data={earningsOverTimeState.data} />
    </Flex>
  )
}

export default MyEarningsSection
