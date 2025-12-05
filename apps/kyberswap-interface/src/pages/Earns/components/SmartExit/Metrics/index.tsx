import { Label, RadioGroup, RadioGroupItem } from '@kyber/ui'
import { Trans } from '@lingui/macro'
import { Trash2 } from 'react-feather'
import { Flex } from 'rebass'

import useTheme from 'hooks/useTheme'
import MetricSelect from 'pages/Earns/components/SmartExit/Metrics/MetricSelect'
import { Divider } from 'pages/Earns/components/SmartExit/styles'
import { getDefaultCondition } from 'pages/Earns/components/SmartExit/utils'
import { ConditionType, Metric, ParsedPosition, SelectedMetric } from 'pages/Earns/types'
import { ButtonText } from 'theme'

const supportedMetrics = [Metric.FeeYield, Metric.PoolPrice, Metric.Time]

export default function Metrics({
  position,
  selectedMetrics,
  setSelectedMetrics,
  conditionType,
  setConditionType,
}: {
  position: ParsedPosition
  selectedMetrics: SelectedMetric[]
  setSelectedMetrics: (value: SelectedMetric[]) => void
  conditionType: ConditionType
  setConditionType: (v: ConditionType) => void
}) {
  const theme = useTheme()
  const [metric1, metric2] = selectedMetrics

  const onChangeMetric1 = (value: SelectedMetric) => setSelectedMetrics(metric2 ? [value, metric2] : [value])
  const onChangeMetric2 = (value: SelectedMetric) => setSelectedMetrics([metric1, value])
  const onRemoveMetric2 = () => setSelectedMetrics([metric1])
  const onAddMetric2 = () => {
    const newMetric = supportedMetrics.filter(item => item !== metric1.metric)[0]
    const newCondition = getDefaultCondition(newMetric)
    if (!newCondition) return
    setSelectedMetrics([metric1, { metric: newMetric, condition: newCondition }])
  }

  return (
    <Flex flexDirection="column">
      <MetricSelect metric={metric1} setMetric={onChangeMetric1} selectedMetric={metric2} position={position} />
      <Divider my="1rem" />
      {metric2 ? (
        <>
          <Flex justifyContent="space-between" alignItems="center">
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
            <ButtonText
              style={{
                width: 'fit-content',
                color: theme.red,
                fontSize: '14px',
                marginRight: '2px',
              }}
              onClick={onRemoveMetric2}
            >
              <Trash2 size={16} color={theme.subText} />
            </ButtonText>
          </Flex>
          <Divider my="1rem" />
          <MetricSelect metric={metric2} setMetric={onChangeMetric2} selectedMetric={metric1} position={position} />
        </>
      ) : (
        <ButtonText
          style={{
            width: 'fit-content',
            color: theme.primary,
          }}
          onClick={onAddMetric2}
        >
          + <Trans>Add Condition 2</Trans>
        </ButtonText>
      )}
    </Flex>
  )
}
