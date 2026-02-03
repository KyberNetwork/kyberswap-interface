import { Label, RadioGroup, RadioGroupItem } from '@kyber/ui'
import { Trans } from '@lingui/macro'
import { Box, Flex } from 'rebass'

import useTheme from 'hooks/useTheme'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import MetricSelect from 'pages/Earns/components/SmartExit/Metrics/MetricSelect'
import { CustomBox } from 'pages/Earns/components/SmartExit/styles'
import { getTimeCondition } from 'pages/Earns/components/SmartExit/utils/typeGuards'
import { ConditionType, Metric, ParsedPosition, SelectedMetric } from 'pages/Earns/types'
import { ButtonText } from 'theme'

interface MetricsProps {
  position: ParsedPosition | null
  selectedMetrics: Array<SelectedMetric | null>
  setSelectedMetrics: (value: Array<SelectedMetric | null>) => void
  conditionType: ConditionType
  setConditionType: (v: ConditionType) => void
  isLoading?: boolean
}

export default function Metrics({
  position,
  selectedMetrics,
  setSelectedMetrics,
  conditionType,
  setConditionType,
  isLoading = false,
}: MetricsProps) {
  const theme = useTheme()
  const [metric1, metric2] = selectedMetrics

  const onChangeMetric1 = (value: SelectedMetric) =>
    setSelectedMetrics(metric2 !== undefined ? [value, metric2] : [value])
  const onChangeMetric2 = (value: SelectedMetric) => {
    if (metric1 === null) return
    setSelectedMetrics([{ ...metric1 }, value])
  }
  const onRemoveMetric2 = () => {
    if (metric1 === null) return
    let newMetric1 = metric1
    if (metric1.metric === Metric.Time) {
      const timeCondition = getTimeCondition(metric1)
      if (timeCondition && timeCondition.condition === 'before') {
        newMetric1 = { ...metric1, condition: { ...timeCondition, condition: 'after' } }
      }
    }
    setSelectedMetrics([newMetric1])
  }
  const onAddMetric2 = () => {
    if (metric1 === null) return
    setSelectedMetrics([{ ...metric1 }, null])
  }

  if (isLoading || !position) {
    return (
      <Flex flexDirection="column">
        <CustomBox>
          <Flex alignItems="center" justifyContent="space-between" mb="12px">
            <PositionSkeleton width={120} height={20} />
            <PositionSkeleton width={80} height={32} />
          </Flex>
          <PositionSkeleton width="100%" height={40} />
          <Box mt="12px">
            <PositionSkeleton width="100%" height={60} />
          </Box>
        </CustomBox>
        <Box mt="1rem">
          <PositionSkeleton width={120} height={20} />
        </Box>
      </Flex>
    )
  }

  return (
    <Flex flexDirection="column">
      <MetricSelect
        metric={metric1}
        setMetric={onChangeMetric1}
        selectedMetric={metric2}
        position={position}
        isFirstMetric
      />
      {metric2 !== undefined ? (
        <>
          <Box py="1rem">
            <RadioGroup value={conditionType} onValueChange={v => setConditionType(v as ConditionType)}>
              <Flex sx={{ gap: '8px' }}>
                <RadioGroupItem value={ConditionType.And} id={ConditionType.And} />
                <Label htmlFor={ConditionType.And}>
                  <Trans>And</Trans>
                </Label>

                <RadioGroupItem value={ConditionType.Or} id={ConditionType.Or} style={{ marginLeft: '24px' }} />
                <Label htmlFor={ConditionType.Or}>
                  <Trans>Or</Trans>
                </Label>
              </Flex>
            </RadioGroup>
          </Box>
          <MetricSelect
            metric={metric2}
            setMetric={onChangeMetric2}
            selectedMetric={metric1}
            position={position}
            onRemove={onRemoveMetric2}
          />
        </>
      ) : (
        <Box mt="1rem">
          <ButtonText
            style={{
              width: 'fit-content',
              color: theme.primary,
            }}
            onClick={onAddMetric2}
          >
            + <Trans>Add Condition 2</Trans>
          </ButtonText>
        </Box>
      )}
    </Flex>
  )
}
