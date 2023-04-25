import { Trans } from '@lingui/macro'
import React, { useMemo, useState } from 'react'
import { Maximize, Minimize2 } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import EarningAreaChart from 'components/EarningAreaChart'
import Loader from 'components/Loader'
import LoaderWithKyberLogo from 'components/LocalLoader'
import useTheme from 'hooks/useTheme'

import { Props as CommonProps } from '.'
import TimePeriodSelect, { TimePeriod } from './TimePeriodSelect'

const formatValue = (value: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'standard',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(value)
}

//TODO: move to common
export const formatPercent = (value: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(value) + '%'
}

const MemoEarningAreaChart = React.memo(EarningAreaChart)

const PercentDiff = styled.div<{ $color?: string }>`
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;

  color: ${({ theme, $color }) => $color || theme.subText};
`

const Wrapper = styled.div`
  overflow: hidden; /* Responsiveness won't work without this */

  flex: 1 1 0%;
  align-self: stretch;

  display: flex;
  flex-direction: column;
  padding: 24px;
  border-radius: 20px;
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
}

const BasePanel: React.FC<Props> = ({
  className,
  isZoomed = false,
  isLoading,
  ticks,
  isContainerSmall,
  toggleModal,
}) => {
  const theme = useTheme()
  const [period, setPeriod] = useState<TimePeriod>('7D')
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayTicks = useMemo(() => {
    if (!ticks) {
      return undefined
    }

    // ticks are sorted from the today backwards. need to reverse
    return ticks.slice(0, numberOfTicksByTimePeriod[period]).reverse()
  }, [period, ticks])

  const todayValue = displayTicks?.slice(-1)[0]?.totalValue

  const renderPercentDiff = () => {
    if (isLoading || !displayTicks?.length) {
      return <PercentDiff>--</PercentDiff>
    }

    const firstValue = displayTicks[0].totalValue
    const lastValue = displayTicks.slice(-1)[0].totalValue

    const diffValue = hoverValue !== null ? hoverValue - lastValue : lastValue - firstValue
    const compareValue = hoverValue !== null ? lastValue : firstValue

    if (!Number.isFinite(diffValue) || !Number.isFinite(compareValue)) {
      return <PercentDiff>--</PercentDiff>
    }

    const diffPercent = (diffValue / compareValue) * 100

    return (
      <PercentDiff $color={diffValue > 0 ? theme.primary : diffValue < 0 ? theme.red : undefined}>
        {formatValue(diffValue)} ({formatPercent(diffPercent)})
      </PercentDiff>
    )
  }

  return (
    <Wrapper className={className}>
      <Flex
        sx={{
          flexDirection: isContainerSmall ? 'column-reverse' : 'row',
          justifyContent: isContainerSmall ? undefined : 'space-between',
          gap: '16px',
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
            <Trans>My Earnings ({period})</Trans>
          </Text>

          <Text
            sx={{
              fontWeight: 500,
              fontSize: '20px',
              lineHeight: '24px',
              marginTop: '8px',
              marginBottom: '4px',
            }}
          >
            {isLoading || !displayTicks ? <Loader /> : formatValue(hoverValue || todayValue || 0)}
          </Text>

          {renderPercentDiff()}
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
        <MemoEarningAreaChart data={displayTicks} setHoverValue={setHoverValue} />
      )}
    </Wrapper>
  )
}

export default BasePanel
