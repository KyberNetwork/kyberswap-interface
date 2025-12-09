import { Trans, t } from '@lingui/macro'
import { useMemo } from 'react'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import FeeYieldInput from 'pages/Earns/components/SmartExit/Metrics/FeeYieldInput'
import PriceInput from 'pages/Earns/components/SmartExit/Metrics/PriceInput'
import TimeInput from 'pages/Earns/components/SmartExit/Metrics/TimeInput'
import { CustomSelect } from 'pages/Earns/components/SmartExit/styles'
import { getDefaultCondition } from 'pages/Earns/components/SmartExit/utils'
import { Metric, ParsedPosition, SelectedMetric } from 'pages/Earns/types'

export default function MetricSelect({
  metric,
  setMetric,
  selectedMetric,
  position,
}: {
  metric: SelectedMetric
  setMetric: (value: SelectedMetric) => void
  selectedMetric?: SelectedMetric
  position: ParsedPosition
}) {
  const theme = useTheme()
  const metricOptions = useMemo(
    () =>
      [
        {
          label: t`Fee Yield`,
          value: Metric.FeeYield,
        },
        {
          label: t`Pool Price`,
          value: Metric.PoolPrice,
        },
        {
          label: t`Time`,
          value: Metric.Time,
        },
      ].filter(item => item.value !== selectedMetric?.metric),
    [selectedMetric],
  )

  return (
    <>
      <Flex alignItems="center" sx={{ gap: '1rem' }} justifyContent="space-between" mb="1rem">
        <Text>
          <Trans>Select Metric</Trans>
        </Text>
        <CustomSelect
          options={metricOptions}
          onChange={value => {
            if (value === metric.metric) return
            const newMetric = value as Metric
            const condition = getDefaultCondition(newMetric)
            if (condition === null) return
            setMetric({ metric: newMetric, condition })
          }}
          value={metric.metric}
          menuStyle={{ width: '250px', marginTop: '2px' }}
          arrow="chevron"
          arrowSize={16}
          arrowColor={theme.border}
        />
      </Flex>

      {metric.metric === Metric.FeeYield && <FeeYieldInput metric={metric} setMetric={setMetric} />}

      {metric.metric === Metric.PoolPrice && <PriceInput metric={metric} setMetric={setMetric} position={position} />}

      {metric.metric === Metric.Time && (
        <TimeInput metric={metric} setMetric={setMetric} selectedMetric={selectedMetric} />
      )}
    </>
  )
}
