import { Trans } from '@lingui/macro'
import React, { useMemo } from 'react'
import { Maximize, Minimize2 } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import EarningAreaChart from 'components/EarningAreaChart'
import LoaderWithKyberLogo from 'components/LocalLoader'
import useTheme from 'hooks/useTheme'

import { Props as CommonProps } from '.'
import TimePeriodSelect, { TimePeriod } from './TimePeriodSelect'

const MemoEarningAreaChart = React.memo(EarningAreaChart)

const Wrapper = styled.div`
  overflow: hidden; /* Responsiveness won't work without this */

  flex: 1 1 0%;
  align-self: stretch;

  display: flex;
  flex-direction: column;
  padding: 16px;
  padding-bottom: 6px;
  background-color: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
`

const numberOfTicksByTimePeriod: Record<TimePeriod, number> = {
  '7D': 7,
  '1M': 30,
  '6M': 180,
  '1Y': 365,
}

type Props = CommonProps & {
  isZoomed?: boolean
  toggleModal: () => void
  initialPeriod?: TimePeriod
  period: TimePeriod
  setPeriod: (p: TimePeriod) => void
}

const BasePanel: React.FC<Props> = ({
  className,
  isZoomed = false,
  isLoading,
  ticks,
  isContainerSmall,
  toggleModal,
  period,
  setPeriod,
}) => {
  const theme = useTheme()

  const displayTicks = useMemo(() => {
    if (!ticks) {
      return undefined
    }

    // ticks are sorted from the today backwards. need to reverse
    return ticks.slice(0, numberOfTicksByTimePeriod[period]).reverse()
  }, [period, ticks])

  const fromDateStr = displayTicks?.[0]?.date || ''
  const toDateStr = displayTicks?.slice(-1)[0]?.date || ''

  return (
    <Wrapper className={className}>
      <Flex
        sx={{
          flexDirection: isContainerSmall ? 'column-reverse' : 'row',
          justifyContent: isContainerSmall ? undefined : 'space-between',
          gap: isContainerSmall ? '4px' : '16px',
        }}
      >
        <Flex
          sx={{
            flex: '0 0 fit-content',
            flexDirection: isContainerSmall ? 'row' : 'column',
            justifyContent: isContainerSmall ? 'space-between' : undefined,
            alignItems: isContainerSmall ? 'center' : undefined,
          }}
        >
          <Text
            as="span"
            sx={{
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: theme.subText,
            }}
          >
            <Trans>Timeframe</Trans>
          </Text>

          <Text
            sx={{
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: theme.text,
            }}
          >
            {fromDateStr} - {toDateStr}
          </Text>
        </Flex>

        <Flex
          sx={{
            alignItems: 'center',
            gap: '8px',
            height: 'fit-content',
            flexWrap: 'nowrap',
            flex: isContainerSmall ? '1 1 100%' : '0 0 240px',
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

      {isLoading || !displayTicks ? (
        <LoaderWithKyberLogo />
      ) : (
        <MemoEarningAreaChart data={displayTicks} period={period} />
      )}
    </Wrapper>
  )
}

export default BasePanel
