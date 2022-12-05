import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Maximize, Minimize2 } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import EarningBarChart from 'components/EarningBarChart'
import Loader from 'components/Loader'
import LoaderWithKyberLogo from 'components/LocalLoader'
import useTheme from 'hooks/useTheme'
import { useToggleMyEarningsZoomOutModal } from 'state/application/hooks'
import { TimePeriod } from 'state/myEarnings/reducer'
import { EarningStatsOverTime } from 'types/myEarnings'
import { formattedNumLong } from 'utils'

import TimePeriodSelect from './TimePeriodSelect'

const Wrapper = styled.div`
  flex: 1;
  align-self: stretch;

  display: flex;
  flex-direction: column;
  padding: 24px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
`

type Props = {
  isZoomed?: boolean
  className?: string

  isLoading?: boolean
  data?: EarningStatsOverTime
}

const MyEarningsOverTimePanel: React.FC<Props> = ({ className, isZoomed = false, isLoading, data }) => {
  const theme = useTheme()
  const [period, setPeriod] = useState<TimePeriod>('1D')
  const toggleModal = useToggleMyEarningsZoomOutModal()

  return (
    <Wrapper className={className}>
      <Flex
        sx={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Flex
          sx={{
            width: 'fit-content',
            flexDirection: 'column',
          }}
        >
          <Text
            as="span"
            sx={{
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '16px',
              color: theme.subText,
            }}
          >
            <Trans>Earnings ({period})</Trans>
          </Text>

          <Text
            sx={{
              fontWeight: 500,
              fontSize: '20px',
              lineHeight: '24px',
              marginTop: '8px',
              marginBottom: '12px',
            }}
          >
            {isLoading || !data ? <Loader /> : formattedNumLong(data.totalValue, true)}
          </Text>
        </Flex>

        <Flex
          sx={{
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TimePeriodSelect period={period} setPeriod={setPeriod} />
          <Flex
            onClick={toggleModal}
            sx={{
              cursor: 'pointer',
            }}
          >
            {isZoomed ? <Minimize2 size={22} /> : <Maximize size={22} />}
          </Flex>
        </Flex>
      </Flex>

      {isLoading || !data ? <LoaderWithKyberLogo /> : <EarningBarChart data={data.ticks} />}
    </Wrapper>
  )
}

export default MyEarningsOverTimePanel
