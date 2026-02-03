import { Trans, t } from '@lingui/macro'
import { useMemo } from 'react'
import { X } from 'react-feather'
import { Box, Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { HighlightWrapper, useGuidedHighlight } from 'pages/Earns/components/SmartExit/GuidedHighlight'
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
  onRemove,
  isFirstMetric = false,
}: {
  metric: SelectedMetric | null
  setMetric: (value: SelectedMetric) => void
  selectedMetric?: SelectedMetric | null
  position: ParsedPosition
  onRemove?: () => void
  isFirstMetric?: boolean
}) {
  const theme = useTheme()
  const { currentStep } = useGuidedHighlight()

  // Highlight dropdown when on metric-select step OR both step
  const shouldHighlightDropdown = isFirstMetric && (currentStep === 'metric-select' || currentStep === 'both')
  // Highlight input when on metric-input step OR both step
  const shouldHighlightInput = isFirstMetric && (currentStep === 'metric-input' || currentStep === 'both')

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
    <Flex
      flexDirection="column"
      p="1rem"
      sx={{ borderRadius: '12px', border: `1px solid ${theme.tabActive}`, gap: '12px', position: 'relative' }}
    >
      {onRemove && (
        <Box sx={{ position: 'absolute', top: '4px', right: '4px', cursor: 'pointer' }}>
          <X onClick={onRemove} size={14} color={theme.subText} />
        </Box>
      )}
      <Flex alignItems="center" sx={{ gap: '1rem' }} justifyContent="space-between">
        <Text>
          <Trans>Select Metric</Trans>
        </Text>
        <HighlightWrapper isHighlighted={shouldHighlightDropdown}>
          <CustomSelect
            options={metricOptions}
            onChange={value => {
              if (value === metric?.metric) return
              const newMetric = value as Metric
              const condition = getDefaultCondition(newMetric, position)
              if (condition === null) return
              setMetric({ metric: newMetric, condition })
            }}
            value={metric?.metric ?? null}
            placeholder={<Trans>Select</Trans>}
            menuStyle={{ width: '250px', marginTop: '2px' }}
            arrow="chevron"
            arrowSize={16}
            arrowColor={theme.border}
          />
        </HighlightWrapper>
      </Flex>

      {metric !== null && metric.metric === Metric.FeeYield && (
        <FeeYieldInput metric={metric} setMetric={setMetric} isHighlighted={shouldHighlightInput} />
      )}

      {metric !== null && metric.metric === Metric.PoolPrice && (
        <PriceInput metric={metric} setMetric={setMetric} position={position} isHighlighted={shouldHighlightInput} />
      )}

      {metric !== null && metric.metric === Metric.Time && (
        <TimeInput
          metric={metric}
          setMetric={setMetric}
          selectedMetric={selectedMetric}
          isHighlighted={shouldHighlightInput}
        />
      )}
    </Flex>
  )
}
