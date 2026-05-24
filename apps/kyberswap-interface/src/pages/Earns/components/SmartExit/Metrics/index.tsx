import { Label, RadioGroup, RadioGroupItem } from '@kyber/ui'
import { Trans } from '@lingui/macro'

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
  revertPrice?: boolean
}

export default function Metrics({
  position,
  selectedMetrics,
  setSelectedMetrics,
  conditionType,
  setConditionType,
  isLoading = false,
  revertPrice = false,
}: MetricsProps) {
  const [metric1, metric2] = selectedMetrics

  const onChangeMetric1 = (value: SelectedMetric) =>
    setSelectedMetrics(metric2 !== undefined ? [value, metric2] : [value])
  const onChangeMetric2 = (value: SelectedMetric) => {
    if (metric1 === null) return
    setSelectedMetrics([{ ...metric1 }, value])
  }
  const onRemoveMetric1 = () => {
    if (metric2 === null || metric2 === undefined) return
    let newMetric2 = metric2
    if (metric2.metric === Metric.Time) {
      const timeCondition = getTimeCondition(metric2)
      if (timeCondition && timeCondition.condition === 'before') {
        newMetric2 = { ...metric2, condition: { ...timeCondition, condition: 'after' } }
      }
    }
    setSelectedMetrics([newMetric2])
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
      <div className="flex flex-col">
        <CustomBox>
          <div className="mb-3 flex items-center justify-between">
            <PositionSkeleton width={120} height={20} />
            <PositionSkeleton width={80} height={32} />
          </div>
          <PositionSkeleton width="100%" height={40} />
          <div className="mt-3">
            <PositionSkeleton width="100%" height={60} />
          </div>
        </CustomBox>
        <div className="mt-4">
          <PositionSkeleton width={120} height={20} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <MetricSelect
        metric={metric1}
        setMetric={onChangeMetric1}
        selectedMetric={metric2}
        position={position}
        isFirstMetric
        onRemove={metric2 !== undefined ? onRemoveMetric1 : undefined}
        revertPrice={revertPrice}
      />
      {metric2 !== undefined ? (
        <>
          <div className="py-4">
            <RadioGroup value={conditionType} onValueChange={v => setConditionType(v as ConditionType)}>
              <div className="flex gap-2">
                <RadioGroupItem value={ConditionType.And} id={ConditionType.And} />
                <Label htmlFor={ConditionType.And}>
                  <Trans>And</Trans>
                </Label>

                <RadioGroupItem value={ConditionType.Or} id={ConditionType.Or} style={{ marginLeft: '24px' }} />
                <Label htmlFor={ConditionType.Or}>
                  <Trans>Or</Trans>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <MetricSelect
            metric={metric2}
            setMetric={onChangeMetric2}
            selectedMetric={metric1}
            position={position}
            onRemove={onRemoveMetric2}
            revertPrice={revertPrice}
          />
        </>
      ) : (
        <div className="mt-4">
          <ButtonText
            className="text-primary"
            style={{
              width: 'fit-content',
            }}
            onClick={onAddMetric2}
          >
            + <Trans>Add Condition 2</Trans>
          </ButtonText>
        </div>
      )}
    </div>
  )
}
